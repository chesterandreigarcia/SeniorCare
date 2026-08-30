import mongoose from "mongoose";
import Verification from "../models/Verification.js";
import Senior from "../models/Senior.js";
import User from "../models/User.js";
import { ACCOUNT_STATUS, VERIFICATION_STATUS, ROLES } from "../utils/constants.js";
import { NotFoundError, AuthorizationError, ConflictError } from "../utils/errors.js";

/**
 * Returns pending verifications, scoped to the requesting staff member's
 * assigned barangay unless they hold ADMIN/LGU_OSCA (broader) access.
 */
export async function listPendingVerifications(requestingUser) {
  const query = { status: VERIFICATION_STATUS.PENDING };

  const hasBroadAccess = [ROLES.ADMIN, ROLES.LGU_OSCA].includes(requestingUser.role);
  if (!hasBroadAccess) {
    if (!requestingUser.assignedBarangayId) {
      // Staff with no assigned barangay sees nothing — fail closed, not open.
      return [];
    }
    query.barangayId = requestingUser.assignedBarangayId;
  }

  return Verification.find(query)
    .populate({ path: "seniorId", select: "firstName lastName dateOfBirth mobileNumber" })
    .populate({ path: "barangayId", select: "name municipality" })
    .sort({ createdAt: 1 });
}

export async function getVerificationById(verificationId, requestingUser) {
  const verification = await Verification.findById(verificationId)
    .populate("seniorId")
    .populate("barangayId", "name municipality province");

  if (!verification) throw new NotFoundError("Verification record not found.");

  assertBarangayScope(verification, requestingUser);
  return verification;
}

function assertBarangayScope(verification, requestingUser) {
  const hasBroadAccess = [ROLES.ADMIN, ROLES.LGU_OSCA].includes(requestingUser.role);
  if (hasBroadAccess) return;

  const scopedBarangayId = requestingUser.assignedBarangayId;
  const verificationBarangayId = verification.barangayId._id
    ? verification.barangayId._id.toString()
    : verification.barangayId.toString();

  if (!scopedBarangayId || scopedBarangayId !== verificationBarangayId) {
    throw new AuthorizationError("You are not authorized to manage registrations outside your assigned barangay.");
  }
}

export async function approveVerification(verificationId, requestingUser, { remarks } = {}) {
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      const verification = await Verification.findById(verificationId).session(session);
      if (!verification) throw new NotFoundError("Verification record not found.");

      assertBarangayScope(verification, requestingUser);

      if (verification.status !== VERIFICATION_STATUS.PENDING) {
        throw new ConflictError("This registration has already been reviewed.");
      }

      const senior = await Senior.findById(verification.seniorId).session(session);
      if (!senior) throw new NotFoundError("Associated senior profile not found.");

      verification.status = VERIFICATION_STATUS.APPROVED;
      verification.reviewedBy = requestingUser.id;
      verification.reviewedAt = new Date();
      verification.remarks = remarks || "";
      await verification.save({ session });

      await User.findByIdAndUpdate(
        senior.userId,
        { status: ACCOUNT_STATUS.ACTIVE },
        { session }
      );

      result = verification;
    });
    return result;
  } finally {
    await session.endSession();
  }
}

export async function rejectVerification(verificationId, requestingUser, { reason }) {
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      const verification = await Verification.findById(verificationId).session(session);
      if (!verification) throw new NotFoundError("Verification record not found.");

      assertBarangayScope(verification, requestingUser);

      if (verification.status !== VERIFICATION_STATUS.PENDING) {
        throw new ConflictError("This registration has already been reviewed.");
      }

      const senior = await Senior.findById(verification.seniorId).session(session);
      if (!senior) throw new NotFoundError("Associated senior profile not found.");

      verification.status = VERIFICATION_STATUS.REJECTED;
      verification.reviewedBy = requestingUser.id;
      verification.reviewedAt = new Date();
      verification.rejectionReason = reason;
      await verification.save({ session });

      await User.findByIdAndUpdate(
        senior.userId,
        { status: ACCOUNT_STATUS.REJECTED },
        { session }
      );

      result = verification;
    });
    return result;
  } finally {
    await session.endSession();
  }
}
