import Senior from "../models/Senior.js";
import Verification from "../models/Verification.js";
import Document from "../models/Document.js";
import Concern from "../models/Concern.js";
import { CONCERN_STATUS } from "../utils/constants.js";
import { listAuthorizedSeniorsForGuardian, resolveActingSenior } from "../utils/guardianAccess.js";
import * as pensionClaimService from "./pensionClaim.service.js";

function summarizeSenior(senior) {
  return {
    _id: senior._id,
    firstName: senior.firstName,
    lastName: senior.lastName,
    seniorCitizenId: senior.seniorCitizenId,
    bedridden: senior.bedridden,
    status: senior.status,
    barangay: senior.barangayId && senior.barangayId.name ? senior.barangayId : null,
  };
}

/** "My Managed Seniors" — every Senior this Guardian is currently authorized for. */
export async function listManagedSeniors(requestingUser) {
  const seniors = await listAuthorizedSeniorsForGuardian(requestingUser);
  return seniors.map(summarizeSenior);
}

/**
 * A single managed Senior's summary — reuses resolveActingSenior for the
 * authorization check itself (the same bidirectional Guardian<->Senior
 * verification every other module already relies on), so a Guardian can
 * never retrieve a Senior they aren't actually authorized for, and a
 * requestedSeniorId that isn't one of their own authorized Seniors fails
 * exactly like an entirely missing one would.
 */
export async function getManagedSeniorDetail(requestingUser, seniorId) {
  const senior = await resolveActingSenior(requestingUser, seniorId);
  const populated = await Senior.findById(senior._id).populate("barangayId", "name municipality");

  const [verification, documents] = await Promise.all([
    Verification.findOne({ seniorId: senior._id }).sort({ createdAt: -1 }),
    Document.find({ seniorId: senior._id }).sort({ uploadedAt: -1 }),
  ]);

  return {
    ...summarizeSenior(populated),
    verificationStatus: verification ? verification.status : null,
    documents: documents.map((d) => ({
      _id: d._id,
      documentType: d.documentType,
      fileName: d.fileName,
      uploadedAt: d.uploadedAt,
    })),
  };
}

/**
 * Aggregated Guardian dashboard: counts and recent items across every
 * Senior this Guardian manages. Reuses pensionClaim.service.js and
 * queries Concern directly (mirroring how Senior's own dashboard would
 * read the same data) rather than re-implementing pension/concern logic
 * here — this file only aggregates, it does not duplicate business logic.
 */
export async function getGuardianDashboard(requestingUser) {
  const seniors = await listAuthorizedSeniorsForGuardian(requestingUser);
  const seniorIds = seniors.map((s) => s._id);

  const [pendingConcerns, upcomingClaims] = await Promise.all([
    Concern.countDocuments({ seniorId: { $in: seniorIds }, status: { $ne: CONCERN_STATUS.RESOLVED } }),
    Promise.all(
      seniors.map(async (senior) => {
        try {
          const claim = await pensionClaimService.getMyUpcomingClaim(senior.userId);
          return claim ? { senior: summarizeSenior(senior), claim } : null;
        } catch {
          return null;
        }
      })
    ),
  ]);

  return {
    managedSeniorsCount: seniors.length,
    managedSeniors: seniors.map(summarizeSenior),
    pendingConcernsCount: pendingConcerns,
    upcomingPensionClaims: upcomingClaims.filter(Boolean),
  };
}
