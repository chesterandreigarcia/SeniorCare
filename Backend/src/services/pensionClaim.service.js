import mongoose from "mongoose";
import crypto from "node:crypto";
import QRCode from "qrcode";
import PensionSchedule from "../models/PensionSchedule.js";
import PensionClaim from "../models/PensionClaim.js";
import Pension from "../models/Pension.js";
import Senior from "../models/Senior.js";
import { CLAIM_STATUS, SCHEDULE_STATUS } from "../utils/constants.js";
import { NotFoundError, ConflictError, ValidationError, AuthorizationError } from "../utils/errors.js";
import { assertCanAccessBarangay } from "../utils/barangayScope.js";

const SENIOR_SUMMARY_FIELDS = "firstName lastName seniorCitizenId";

/**
 * Books a claiming slot for the authenticated Senior (`userId` from the
 * verified token — never a client-supplied seniorId).
 *
 * Concurrency safety, without relying on a distributed lock:
 *  1. The slot reservation is a single atomic document update
 *     (`findOneAndUpdate` with `availableCount: { $gt: 0 }` in the query
 *     filter) — MongoDB guarantees this is race-free even under
 *     concurrent requests for the same slot, so two Seniors can never
 *     both win the last seat.
 *  2. Duplicate active bookings are additionally rejected by a
 *     DB-level partial unique index on PensionClaim (see the model) —
 *     not just an application-level "already booked?" check — so it
 *     holds even under a race between two requests from the same Senior.
 *  3. Both writes happen inside a transaction, so a failure creating the
 *     PensionClaim (e.g. the duplicate-index violation) automatically
 *     rolls back the slot reservation instead of leaving an orphaned
 *     decremented seat.
 */
export async function bookSlot(userId, { scheduleId, slotId }) {
  const senior = await Senior.findOne({ userId });
  if (!senior) throw new NotFoundError("Senior profile not found.");

  const pension = await Pension.findOne({ seniorId: senior._id });
  if (!pension) {
    throw new ValidationError("You don't have a pension record on file yet. Please contact your Barangay office.");
  }

  const schedule = await PensionSchedule.findById(scheduleId);
  if (!schedule) throw new NotFoundError("Claiming schedule not found.");
  if (schedule.barangayId.toString() !== senior.barangayId.toString()) {
    throw new AuthorizationError("This claiming schedule is not available to your Barangay.");
  }
  if (schedule.status !== SCHEDULE_STATUS.OPEN) {
    throw new ConflictError("This claiming schedule is no longer open for booking.");
  }

  const slot = schedule.slots.id(slotId);
  if (!slot) throw new NotFoundError("Claiming slot not found.");

  const session = await mongoose.startSession();
  try {
    let claim;
    await session.withTransaction(async () => {
      const reserved = await PensionSchedule.findOneAndUpdate(
        { _id: scheduleId, "slots._id": slotId, "slots.availableCount": { $gt: 0 } },
        { $inc: { "slots.$.availableCount": -1, "slots.$.bookedCount": 1 } },
        { new: true, session }
      );

      if (!reserved) {
        throw new ConflictError("This claiming slot is no longer available. Please select another slot.");
      }

      const reservedSlot = reserved.slots.id(slotId);
      if (reservedSlot.availableCount === 0) {
        reservedSlot.status = "FULL";
        await reserved.save({ session });
      }

      try {
        const created = await PensionClaim.create(
          [
            {
              seniorId: senior._id,
              pensionId: pension._id,
              barangayId: senior.barangayId,
              scheduleId: schedule._id,
              slotId: slot._id,
              scheduledDate: schedule.date,
              scheduledStartTime: slot.startTime,
              scheduledEndTime: slot.endTime,
              location: schedule.location,
              amount: pension.pensionAmount,
              status: CLAIM_STATUS.SCHEDULED,
              qrToken: crypto.randomBytes(24).toString("hex"),
            },
          ],
          { session }
        );
        claim = created[0];
      } catch (err) {
        // Duplicate-key error from the partial unique index means this
        // Senior already has an active booking on this schedule.
        if (err?.code === 11000) {
          throw new ConflictError("You already have a booking for this claiming schedule.");
        }
        throw err;
      }
    });
    return claim;
  } finally {
    await session.endSession();
  }
}

/** The Senior's own next upcoming (SCHEDULED) claim, soonest first. */
export async function getMyUpcomingClaim(userId) {
  const senior = await Senior.findOne({ userId });
  if (!senior) throw new NotFoundError("Senior profile not found.");

  return PensionClaim.findOne({ seniorId: senior._id, status: CLAIM_STATUS.SCHEDULED }).sort({ scheduledDate: 1 });
}

/** The Senior's own claiming history (everything not currently scheduled), most recent first. */
export async function getMyClaimHistory(userId) {
  const senior = await Senior.findOne({ userId });
  if (!senior) throw new NotFoundError("Senior profile not found.");

  return PensionClaim.find({ seniorId: senior._id, status: { $ne: CLAIM_STATUS.SCHEDULED } }).sort({
    scheduledDate: -1,
  });
}

/** Renders the Senior's own claim as a scannable QR pass (PNG data URL). */
export async function getMyClaimQr(userId, claimId) {
  const senior = await Senior.findOne({ userId });
  if (!senior) throw new NotFoundError("Senior profile not found.");

  const claim = await PensionClaim.findById(claimId);
  if (!claim || claim.seniorId.toString() !== senior._id.toString()) {
    throw new NotFoundError("Claiming pass not found.");
  }

  // Only the opaque token goes into the QR — never the amount, senior
  // name, or any other personal data.
  const qrDataUrl = await QRCode.toDataURL(claim.qrToken, { margin: 1, width: 320 });
  return { claim, qrDataUrl };
}

/**
 * Barangay Staff/Admin: today's claims for their barangay (or a
 * specific schedule), for the "verify claims" view.
 */
export async function listClaimsForBarangay(requestingUser, { barangayId, scheduleId, date } = {}) {
  const query = {};
  if (barangayId) {
    assertCanAccessBarangay(requestingUser, barangayId);
    query.barangayId = barangayId;
  } else if (requestingUser.assignedBarangayId) {
    query.barangayId = requestingUser.assignedBarangayId;
  }
  if (scheduleId) query.scheduleId = scheduleId;
  if (date) {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    query.scheduledDate = { $gte: start, $lt: end };
  }

  return PensionClaim.find(query)
    .populate({ path: "seniorId", select: SENIOR_SUMMARY_FIELDS })
    .sort({ scheduledDate: 1, scheduledStartTime: 1 });
}

/**
 * Staff scans/enters a QR token. The backend resolves it to a claim and
 * is the sole source of truth — the frontend never sends claimId,
 * status, or barangayId directly, only the opaque token it read from
 * the QR image.
 */
export async function verifyClaimByToken(requestingUser, qrToken) {
  const claim = await PensionClaim.findOne({ qrToken }).populate({ path: "seniorId", select: SENIOR_SUMMARY_FIELDS });
  if (!claim) throw new NotFoundError("Invalid claiming pass.");

  assertCanAccessBarangay(requestingUser, claim.barangayId);

  if (claim.status === CLAIM_STATUS.CLAIMED) {
    throw new ConflictError("This claiming pass has already been used.");
  }
  if (claim.status !== CLAIM_STATUS.SCHEDULED) {
    throw new ConflictError("This claiming pass is no longer valid.");
  }

  claim.status = CLAIM_STATUS.CLAIMED;
  claim.claimedAt = new Date();
  claim.verifiedBy = requestingUser.id;
  await claim.save();

  return claim;
}
