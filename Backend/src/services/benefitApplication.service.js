import mongoose from "mongoose";
import BenefitApplication from "../models/BenefitApplication.js";
import BenefitProgram from "../models/BenefitProgram.js";
import Document from "../models/Document.js";
import Senior from "../models/Senior.js";
import User from "../models/User.js";
import { APPLICATION_STATUS, ACCOUNT_STATUS, DOCUMENT_TYPES, ROLES, NOTIFICATION_TYPE } from "../utils/constants.js";
import { NotFoundError, ConflictError, ValidationError, AuthorizationError } from "../utils/errors.js";
import { assertCanAccessBarangay, hasBroadBarangayAccess } from "../utils/barangayScope.js";
import { resolveActingSenior } from "../utils/guardianAccess.js";
import { computeEligibility } from "./benefitProgram.service.js";
import { createNotification } from "./notification.service.js";

const SENIOR_SUMMARY_FIELDS = "firstName lastName seniorCitizenId barangayId";

// Statuses that count as "an existing application already occupies this
// program for this senior" — a new one may not be started while one of
// these is in flight. REJECTED and CLAIMED are terminal-for-this-round,
// so a fresh application is allowed after either.
const ACTIVE_APPLICATION_STATUSES = [
  APPLICATION_STATUS.SUBMITTED,
  APPLICATION_STATUS.UNDER_REVIEW,
  APPLICATION_STATUS.ENDORSED,
  APPLICATION_STATUS.APPROVED,
  APPLICATION_STATUS.RELEASED,
];

function pushHistory(application, { toStatus, requestingUser, remarks }) {
  application.statusHistory.push({
    fromStatus: application.status,
    toStatus,
    performedBy: requestingUser.id,
    role: requestingUser.role,
    remarks: remarks || "",
    at: new Date(),
  });
  application.status = toStatus;
}

/**
 * Senior/Guardian applies for a benefit program.
 *
 * `requestingUser` is resolved to an acting Senior via
 * `resolveActingSenior` — the caller never supplies a seniorId. For
 * SENIOR_CITIZEN this is exactly today's behavior; the GUARDIAN branch
 * inside that helper is present but unreachable until Guardian login
 * exists (see utils/guardianAccess.js).
 */
export async function applyForBenefit(requestingUser, { benefitProgramId }, uploadedFiles = [], documentTypes = []) {
  const senior = await resolveActingSenior(requestingUser);

  const seniorUser = await User.findById(senior.userId);
  if (!seniorUser || seniorUser.status !== ACCOUNT_STATUS.ACTIVE) {
    throw new ValidationError("Only an active, verified Senior Citizen account may apply for benefits.");
  }

  const program = await BenefitProgram.findById(benefitProgramId);
  if (!program) throw new NotFoundError("Benefit program not found.");

  const { eligible, reasons } = computeEligibility(senior, program);
  if (!eligible) {
    throw new ValidationError("You are not currently eligible for this program.", { reasons });
  }

  const existing = await BenefitApplication.findOne({
    seniorId: senior._id,
    benefitProgramId: program._id,
    status: { $in: ACTIVE_APPLICATION_STATUSES },
  });
  if (existing) {
    throw new ConflictError("You already have an active application for this program.");
  }

  if (program.requiredDocumentTypes.length > 0) {
    const providedTypes = new Set(documentTypes.filter(Boolean));
    const missing = program.requiredDocumentTypes.filter((type) => !providedTypes.has(type));
    if (missing.length > 0) {
      throw new ValidationError("Please upload all required supporting documents.", {
        missingDocumentTypes: missing,
      });
    }
  }

  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      const [application] = await BenefitApplication.create(
        [
          {
            seniorId: senior._id,
            benefitProgramId: program._id,
            barangayId: senior.barangayId,
            appliedBy: requestingUser.id,
            appliedByRole: requestingUser.role,
            status: APPLICATION_STATUS.SUBMITTED,
            statusHistory: [
              {
                fromStatus: null,
                toStatus: APPLICATION_STATUS.SUBMITTED,
                performedBy: requestingUser.id,
                role: requestingUser.role,
                remarks: "",
                at: new Date(),
              },
            ],
          },
        ],
        { session }
      );

      if (uploadedFiles.length > 0) {
        const docs = uploadedFiles.map((file, i) => ({
          seniorId: senior._id,
          verificationId: null,
          documentType: documentTypes[i] || DOCUMENT_TYPES.BENEFIT_SUPPORTING_DOCUMENT,
          fileName: file.originalname,
          storageKey: file.filename,
          mimeType: file.mimetype,
          fileSize: file.size,
          uploadedBy: requestingUser.id,
        }));
        const created = await Document.insertMany(docs, { session });
        application.documentIds = created.map((d) => d._id);
        await application.save({ session });
      }

      result = application;
    });
    // IMPORTANT: must be awaited *inside* this try block. `result` was
    // created with { session } inside the transaction, so Mongoose binds
    // that session to the document. If this populate() call is returned
    // unawaited, the `finally` below runs (and ends the session) before
    // the populate query actually executes, producing
    // "Use of expired sessions is not permitted".
    result = await result.populate({ path: "seniorId", select: SENIOR_SUMMARY_FIELDS });
    return result;
  } finally {
    await session.endSession();
  }
}

/** The acting Senior/Guardian's own application history. */
export async function listMyApplications(requestingUser) {
  const senior = await resolveActingSenior(requestingUser);
  return BenefitApplication.find({ seniorId: senior._id })
    .populate({ path: "benefitProgramId" })
    .sort({ createdAt: -1 });
}

/** A single application, but only if it belongs to the acting Senior/Guardian. */
export async function getMyApplicationById(applicationId, requestingUser) {
  const senior = await resolveActingSenior(requestingUser);
  const application = await BenefitApplication.findOne({ _id: applicationId, seniorId: senior._id })
    .populate({ path: "benefitProgramId" })
    .populate({ path: "documentIds" });
  if (!application) throw new NotFoundError("Benefit application not found.");
  return application;
}

/** Staff/Admin/LGU-OSCA application list, barangay-scoped for BARANGAY_STAFF. */
export async function listApplications(requestingUser, { status, benefitProgramId, barangayId, search } = {}) {
  const query = {};

  if (hasBroadBarangayAccess(requestingUser.role)) {
    if (barangayId) query.barangayId = barangayId;
  } else {
    if (!requestingUser.assignedBarangayId) return [];
    query.barangayId = requestingUser.assignedBarangayId;
  }

  if (status) query.status = status;
  if (benefitProgramId) query.benefitProgramId = benefitProgramId;

  if (search && search.trim()) {
    const term = search.trim();
    const regex = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    const matchingSeniors = await Senior.find({
      $or: [{ firstName: regex }, { lastName: regex }, { seniorCitizenId: regex }],
    }).select("_id");
    query.seniorId = { $in: matchingSeniors.map((s) => s._id) };
  }

  return BenefitApplication.find(query)
    .populate({ path: "seniorId", select: SENIOR_SUMMARY_FIELDS })
    .populate({ path: "benefitProgramId" })
    .sort({ createdAt: -1 });
}

/**
 * Notifies the Senior who applied — resolved via the application's own
 * seniorId, never trusted from anywhere else. Called only after
 * `application.save()` has already committed (none of these status
 * transitions run inside a transaction), so there is no session-safety
 * concern here.
 */
async function notifyApplicant(application, { eventType, title, message }) {
  const senior = await Senior.findById(application.seniorId).select("userId");
  if (!senior) return;
  await createNotification({
    recipientId: senior.userId,
    type: NOTIFICATION_TYPE.BENEFIT,
    eventType,
    title,
    message,
    relatedEntityType: "BenefitApplication",
    relatedEntityId: application._id,
  });
}

async function loadApplicationForAction(applicationId, requestingUser) {
  const application = await BenefitApplication.findById(applicationId);
  if (!application) throw new NotFoundError("Benefit application not found.");
  assertCanAccessBarangay(requestingUser, application.barangayId);
  return application;
}

export async function getApplicationById(applicationId, requestingUser) {
  const application = await BenefitApplication.findById(applicationId)
    .populate({ path: "seniorId", select: SENIOR_SUMMARY_FIELDS })
    .populate({ path: "benefitProgramId" })
    .populate({ path: "documentIds" });
  if (!application) throw new NotFoundError("Benefit application not found.");
  assertCanAccessBarangay(requestingUser, application.barangayId);
  return application;
}

/** Barangay Staff (or Admin/LGU-OSCA) marks a submitted application as under active review. */
export async function startReview(applicationId, requestingUser) {
  const application = await loadApplicationForAction(applicationId, requestingUser);
  if (application.status !== APPLICATION_STATUS.SUBMITTED) {
    throw new ConflictError("Only a newly submitted application can be moved to review.");
  }
  pushHistory(application, { toStatus: APPLICATION_STATUS.UNDER_REVIEW, requestingUser });
  await application.save();
  await notifyApplicant(application, {
    eventType: "BENEFIT_APPLICATION_UNDER_REVIEW",
    title: "Application Under Review",
    message: "Your benefit application is now under review.",
  });
  return application;
}

/** Barangay Staff (or Admin/LGU-OSCA) endorses a reviewed application onward to OSCA. */
export async function endorseApplication(applicationId, requestingUser, { remarks } = {}) {
  const application = await loadApplicationForAction(applicationId, requestingUser);
  if (![APPLICATION_STATUS.SUBMITTED, APPLICATION_STATUS.UNDER_REVIEW].includes(application.status)) {
    throw new ConflictError("Only a submitted or under-review application can be endorsed.");
  }
  application.reviewedBy = requestingUser.id;
  application.reviewedAt = new Date();
  application.remarks = remarks || "";
  pushHistory(application, { toStatus: APPLICATION_STATUS.ENDORSED, requestingUser, remarks });
  await application.save();
  await notifyApplicant(application, {
    eventType: "BENEFIT_APPLICATION_ENDORSED",
    title: "Application Endorsed",
    message: "Your benefit application has been endorsed for OSCA review.",
  });
  return application;
}

/**
 * Rejects an application. Barangay Staff (their own barangay) may
 * reject at the SUBMITTED/UNDER_REVIEW stage; once ENDORSED, only
 * ADMIN/LGU_OSCA (the OSCA review stage) may reject it.
 */
export async function rejectApplication(applicationId, requestingUser, { reason }) {
  const application = await loadApplicationForAction(applicationId, requestingUser);

  if (![APPLICATION_STATUS.SUBMITTED, APPLICATION_STATUS.UNDER_REVIEW, APPLICATION_STATUS.ENDORSED].includes(
    application.status
  )) {
    throw new ConflictError("This application is no longer at a stage that can be rejected.");
  }

  if (application.status === APPLICATION_STATUS.ENDORSED && !hasBroadBarangayAccess(requestingUser.role)) {
    throw new AuthorizationError("Only Admin or LGU-OSCA may reject an application at the OSCA review stage.");
  }

  application.rejectionReason = reason;
  pushHistory(application, { toStatus: APPLICATION_STATUS.REJECTED, requestingUser, remarks: reason });
  await application.save();
  await notifyApplicant(application, {
    eventType: "BENEFIT_APPLICATION_REJECTED",
    title: "Application Rejected",
    message: `Your benefit application was rejected. Reason: ${reason}`,
  });
  return application;
}

/** OSCA-stage approval — ADMIN/LGU_OSCA only, from ENDORSED. */
export async function approveApplication(applicationId, requestingUser, { remarks } = {}) {
  if (!hasBroadBarangayAccess(requestingUser.role)) {
    throw new AuthorizationError("Only Admin or LGU-OSCA may approve a benefit application.");
  }
  const application = await loadApplicationForAction(applicationId, requestingUser);
  if (application.status !== APPLICATION_STATUS.ENDORSED) {
    throw new ConflictError("Only an endorsed application can be approved.");
  }
  application.approvedBy = requestingUser.id;
  application.approvedAt = new Date();
  pushHistory(application, { toStatus: APPLICATION_STATUS.APPROVED, requestingUser, remarks });
  await application.save();
  await notifyApplicant(application, {
    eventType: "BENEFIT_APPLICATION_APPROVED",
    title: "Application Approved",
    message: "Your benefit application has been approved.",
  });
  return application;
}

/** Marks an approved benefit as released/handed over to the Senior. */
export async function releaseApplication(applicationId, requestingUser, { remarks } = {}) {
  const application = await loadApplicationForAction(applicationId, requestingUser);
  if (application.status !== APPLICATION_STATUS.APPROVED) {
    throw new ConflictError("Only an approved application can be released.");
  }
  application.releasedBy = requestingUser.id;
  application.releasedAt = new Date();
  pushHistory(application, { toStatus: APPLICATION_STATUS.RELEASED, requestingUser, remarks });
  await application.save();
  await notifyApplicant(application, {
    eventType: "BENEFIT_APPLICATION_RELEASED",
    title: "Benefit Released",
    message: "Your approved benefit has been released. Please coordinate with your Barangay office to claim it.",
  });
  return application;
}

/** Final confirmation that the Senior received/claimed the released benefit. */
export async function completeApplication(applicationId, requestingUser, { remarks } = {}) {
  const application = await loadApplicationForAction(applicationId, requestingUser);
  if (application.status !== APPLICATION_STATUS.RELEASED) {
    throw new ConflictError("Only a released application can be marked as claimed/completed.");
  }
  application.completedAt = new Date();
  pushHistory(application, { toStatus: APPLICATION_STATUS.CLAIMED, requestingUser, remarks });
  await application.save();
  await notifyApplicant(application, {
    eventType: "BENEFIT_APPLICATION_CLAIMED",
    title: "Application Completed",
    message: "Your benefit application has been marked as completed. Thank you.",
  });
  return application;
}
