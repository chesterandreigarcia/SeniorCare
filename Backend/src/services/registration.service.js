import mongoose from "mongoose";
import User from "../models/User.js";
import Senior from "../models/Senior.js";
import Guardian from "../models/Guardian.js";
import Barangay from "../models/Barangay.js";
import Verification from "../models/Verification.js";
import Document from "../models/Document.js";
import { hashPassword } from "../utils/password.js";
import { ROLES, ACCOUNT_STATUS, VERIFICATION_STATUS, MINIMUM_SENIOR_AGE, DOCUMENT_TYPES } from "../utils/constants.js";
import { ValidationError, ConflictError, NotFoundError } from "../utils/errors.js";

function calculateAge(dateOfBirth) {
  const today = new Date();
  const dob = new Date(dateOfBirth);
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
  return age;
}

/**
 * Registers a new Senior Citizen account.
 *
 * Implements: validate barangay → duplicate checks → eligibility check →
 * hash password → create User + Senior (+ Guardian, + Documents) →
 * create Verification (PENDING) → return safe summary.
 *
 * All writes happen inside a single Mongo transaction so a failure partway
 * through never leaves an orphaned User with no Senior/Verification record.
 */
export async function registerSenior(data, uploadedFiles = {}) {
  const barangay = await Barangay.findById(data.barangayId);
  if (!barangay || !barangay.isActive) {
    throw new ValidationError("The selected barangay is invalid or currently inactive.", {
      barangayId: "Please select a valid, active barangay.",
    });
  }

  // Server-computed age — the frontend's displayed age is never trusted.
  const age = calculateAge(data.dateOfBirth);
  if (age < MINIMUM_SENIOR_AGE) {
    throw new ValidationError(
      `Registrants must be at least ${MINIMUM_SENIOR_AGE} years old to register as a senior citizen.`,
      { dateOfBirth: "This date of birth does not meet the senior citizen age requirement." }
    );
  }

  // Duplicate checks (defense in depth — unique indexes are the final guard).
  const emailInUse = await User.findOne({ email: data.accountEmail.toLowerCase() });
  if (emailInUse) {
    throw new ConflictError("An account with this email already exists.", { accountEmail: "Email already registered." });
  }

  if (data.seniorCitizenId) {
    const idInUse = await Senior.findOne({ seniorCitizenId: data.seniorCitizenId });
    if (idInUse) {
      throw new ConflictError("This Senior Citizen ID is already registered.", {
        seniorCitizenId: "This ID is already associated with another account.",
      });
    }
  }

  const passwordHash = await hashPassword(data.password);

  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      const [user] = await User.create(
        [
          {
            email: data.accountEmail.toLowerCase(),
            passwordHash,
            role: ROLES.SENIOR_CITIZEN,
            status: ACCOUNT_STATUS.PENDING_VERIFICATION,
          },
        ],
        { session }
      );

      const [senior] = await Senior.create(
        [
          {
            userId: user._id,
            barangayId: barangay._id,
            firstName: data.firstName,
            middleName: data.middleName,
            lastName: data.lastName,
            suffix: data.suffix,
            dateOfBirth: data.dateOfBirth,
            sex: data.sex,
            civilStatus: data.civilStatus,
            seniorCitizenId: data.seniorCitizenId || undefined,
            mobileNumber: data.mobileNumber,
            email: data.email,
            address: data.address,
            bedridden: data.bedridden,
          },
        ],
        { session }
      );

      let guardian = null;
      if (data.guardian?.hasGuardian) {
        const [g] = await Guardian.create(
          [
            {
              seniorId: senior._id,
              firstName: data.guardian.firstName,
              middleName: data.guardian.middleName,
              lastName: data.guardian.lastName,
              suffix: data.guardian.suffix,
              relationship: data.guardian.relationship,
              mobileNumber: data.guardian.mobileNumber,
              email: data.guardian.email,
              address: data.guardian.address,
              idType: data.guardian.idType,
              idNumber: data.guardian.idNumber,
            },
          ],
          { session }
        );
        guardian = g;
        senior.guardianId = guardian._id;
        await senior.save({ session });
      }

      const [verification] = await Verification.create(
        [
          {
            seniorId: senior._id,
            barangayId: barangay._id,
            status: VERIFICATION_STATUS.PENDING,
          },
        ],
        { session }
      );

      // Persist document references for whatever files were uploaded.
      const documentEntries = Object.entries(uploadedFiles).filter(([, file]) => Boolean(file));
      if (documentEntries.length) {
        const docs = documentEntries.map(([type, file]) => ({
          seniorId: senior._id,
          verificationId: verification._id,
          documentType: DOCUMENT_TYPES[type] || type,
          fileName: file.originalname,
          storageKey: file.filename,
          mimeType: file.mimetype,
          fileSize: file.size,
          uploadedBy: user._id,
        }));
        await Document.insertMany(docs, { session });
      }

      result = { userId: user._id, seniorId: senior._id, verificationId: verification._id };
    });

    return result;
  } finally {
    await session.endSession();
  }
}

export async function listActiveBarangays() {
  return Barangay.find({ isActive: true }).sort({ name: 1 }).select("name municipality province code");
}

export async function getSeniorByUserId(userId) {
  const senior = await Senior.findOne({ userId }).populate("barangayId", "name municipality province");
  if (!senior) throw new NotFoundError("Senior profile not found.");
  return senior;
}
