import mongoose from "mongoose";
import fs from "node:fs";
import { resolveStoragePath } from "../utils/storage.js";
import Verification from "../models/Verification.js";
import Senior from "../models/Senior.js";
import Guardian from "../models/Guardian.js";
import Document from "../models/Document.js";
import User from "../models/User.js";
import Barangay from "../models/Barangay.js";
import { ACCOUNT_STATUS, VERIFICATION_STATUS, ROLES } from "../utils/constants.js";
import { NotFoundError, AuthorizationError, ConflictError } from "../utils/errors.js";

/**
 * Returns pending verifications, scoped to the requesting staff member's
 * assigned barangay unless they hold ADMIN/LGU_OSCA (broader) access.
 *
 * Supports optional search (senior name / senior citizen ID) and pagination.
 * When no pagination params are supplied, behavior matches the original
 * implementation (full result array) so existing callers aren't affected.
 */
export async function listPendingVerifications(requestingUser, options = null) {
  const { search = "", page, limit, barangayId } = options || {};

  const query = { status: VERIFICATION_STATUS.PENDING };

  const hasBroadAccess = [ROLES.ADMIN, ROLES.LGU_OSCA].includes(requestingUser.role);
  if (!hasBroadAccess) {
    if (!requestingUser.assignedBarangayId) {
      // Staff with no assigned barangay sees nothing — fail closed, not open.
      return options ? { data: [], total: 0, page: 1, limit: 0, totalPages: 1 } : [];
    }
    query.barangayId = requestingUser.assignedBarangayId;
  } else if (barangayId) {
    // Admin/LGU_OSCA may optionally narrow to a single barangay.
    query.barangayId = barangayId;
  }

  if (search && search.trim()) {
    const term = search.trim();
    const regex = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    const matchingSeniors = await Senior.find({
      $or: [{ firstName: regex }, { lastName: regex }, { seniorCitizenId: regex }],
    }).select("_id");
    query.seniorId = { $in: matchingSeniors.map((s) => s._id) };
  }

  const baseQuery = Verification.find(query)
    .populate({ path: "seniorId", select: "firstName lastName dateOfBirth mobileNumber seniorCitizenId" })
    .populate({ path: "barangayId", select: "name municipality" })
    .sort({ createdAt: 1 });

  // Preserve the original behavior exactly when called without `options`
  // (e.g. existing unit tests / any other internal caller): returns a
  // plain array with no pagination wrapper.
  if (!options) {
    return baseQuery;
  }

  const total = await Verification.countDocuments(query);
  const pageNum = Number(page) > 0 ? Number(page) : null;
  const limitNum = Number(limit) > 0 ? Number(limit) : null;

  if (pageNum && limitNum) {
    const results = await baseQuery.skip((pageNum - 1) * limitNum).limit(limitNum);
    return { data: results, total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) || 1 };
  }

  const results = await baseQuery;
  return { data: results, total, page: 1, limit: total, totalPages: 1 };
}

export async function getVerificationById(verificationId, requestingUser) {
  const verification = await Verification.findById(verificationId)
    .populate("seniorId")
    .populate("barangayId", "name municipality province");

  if (!verification) throw new NotFoundError("Verification record not found.");

  assertBarangayScope(verification, requestingUser);

  const senior = verification.seniorId;
  const [guardian, documents] = await Promise.all([
    senior?.guardianId ? Guardian.findById(senior.guardianId) : null,
    Document.find({ seniorId: senior?._id }).select("-storageKey"),
  ]);

  return {
    ...verification.toObject({ virtuals: true }),
    guardian,
    documents,
  };
}

/**
 * Returns dashboard statistics (pending / active / rejected / total seniors),
 * scoped to the requesting user's authorization the same way listPendingVerifications is.
 */
export async function getVerificationStats(requestingUser) {
  const hasBroadAccess = [ROLES.ADMIN, ROLES.LGU_OSCA].includes(requestingUser.role);
  const seniorMatch = {};
  if (!hasBroadAccess) {
    if (!requestingUser.assignedBarangayId) {
      return { pending: 0, active: 0, rejected: 0, total: 0 };
    }
    seniorMatch.barangayId = new mongoose.Types.ObjectId(requestingUser.assignedBarangayId);
  }

  const [pending, statusCounts, total] = await Promise.all([
    Verification.countDocuments({
      status: VERIFICATION_STATUS.PENDING,
      ...(seniorMatch.barangayId ? { barangayId: seniorMatch.barangayId } : {}),
    }),
    Senior.aggregate([
      { $match: seniorMatch },
      { $lookup: { from: "users", localField: "userId", foreignField: "_id", as: "user" } },
      { $unwind: "$user" },
      { $group: { _id: "$user.status", count: { $sum: 1 } } },
    ]),
    Senior.countDocuments(seniorMatch),
  ]);

  const active = statusCounts.find((s) => s._id === ACCOUNT_STATUS.ACTIVE)?.count || 0;
  const rejected = statusCounts.find((s) => s._id === ACCOUNT_STATUS.REJECTED)?.count || 0;

  return { pending, active, rejected, total };
}

/**
 * Resolves an on-disk document for streaming, after checking the requesting
 * user is authorized to view documents for that senior's barangay.
 */
export async function getDocumentForDownload(documentId, requestingUser) {
  const document = await Document.findById(documentId);
  if (!document) throw new NotFoundError("Document not found.");

  const senior = await Senior.findById(document.seniorId).select("barangayId");
  if (!senior) throw new NotFoundError("Associated senior profile not found.");

  const hasBroadAccess = [ROLES.ADMIN, ROLES.LGU_OSCA].includes(requestingUser.role);
  if (!hasBroadAccess) {
    if (!requestingUser.assignedBarangayId || requestingUser.assignedBarangayId !== senior.barangayId.toString()) {
      throw new AuthorizationError("You are not authorized to view this document.");
    }
  }

  // Resolved via the same project-root-anchored UPLOAD_DIR that the upload
  // middleware writes to (utils/storage.js) — not a path re-derived from
  // process.cwd(), which is what previously let uploads and downloads
  // silently disagree on where a file actually lives.
  const filePath = resolveStoragePath(document.storageKey);
  if (!fs.existsSync(filePath)) {
    throw new NotFoundError("The document file could not be found on the server.");
  }

  return { filePath, fileName: document.fileName, mimeType: document.mimeType };
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
