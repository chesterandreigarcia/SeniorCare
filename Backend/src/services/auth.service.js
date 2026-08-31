import crypto from "node:crypto";
import User from "../models/User.js";
import Senior from "../models/Senior.js";
import {
  verifyPassword,
  hashPassword,
  isPasswordStrongEnough,
} from "../utils/password.js";
import { signAccessToken, signRefreshToken } from "../utils/token.js";
import { ACCOUNT_STATUS, ROLES } from "../utils/constants.js";
import {
  AuthenticationError,
  AccountStatusError,
  ValidationError,
  NotFoundError,
} from "../utils/errors.js";

// In-memory placeholder for reset tokens. Replace with a dedicated
// PasswordResetToken collection (token hash, userId, expiresAt, used)
// before shipping to production — kept minimal here to stay focused on
// the core registration/verification/auth architecture.
const resetTokenStore = new Map();

export async function login({ emailOrUsername, password }) {
  const normalized = emailOrUsername.trim().toLowerCase();

  const user = await User.findOne({
    $or: [{ email: normalized }, { username: normalized }],
  }).select("+passwordHash");

  // Generic message regardless of whether the account exists, to avoid
  // account enumeration.
  if (!user) {
    throw new AuthenticationError("Invalid email or password.");
  }

  const passwordMatches = await verifyPassword(password, user.passwordHash);
  if (!passwordMatches) {
    throw new AuthenticationError("Invalid email or password.");
  }

  if (user.status === ACCOUNT_STATUS.PENDING_VERIFICATION) {
    throw new AccountStatusError(
      "Your registration has been submitted successfully, but your barangay has not yet completed verification.",
      "ACCOUNT_PENDING_VERIFICATION",
    );
  }

  if (user.status === ACCOUNT_STATUS.INACTIVE) {
    throw new AccountStatusError(
      "Your SENIORCARE account is currently inactive. Please contact your barangay office for assistance.",
      "ACCOUNT_INACTIVE",
    );
  }

  if (user.status === ACCOUNT_STATUS.REJECTED) {
    throw new AccountStatusError(
      "Your registration was not approved. Please contact your barangay office for more information.",
      "ACCOUNT_REJECTED",
    );
  }

  if (user.status !== ACCOUNT_STATUS.ACTIVE) {
    // Defensive fallback for any future status value.
    throw new AccountStatusError(
      "Your account cannot access SENIORCARE at this time.",
      "ACCOUNT_NOT_ACTIVE",
    );
  }

  user.lastLoginAt = new Date();
  await user.save();

  const accessToken = signAccessToken({
    userId: user._id.toString(),
    role: user.role,
  });
  const refreshToken = signRefreshToken({
    userId: user._id.toString(),
    tokenVersion: user.tokenVersion,
  });

  const responseUser = {
    id: user._id.toString(),
    email: user.email,
    role: user.role,
    status: user.status,
  };

  // Senior Citizens have a 1:1 Senior profile keyed by userId. Returning
  // its id lets the frontend fetch/link the profile immediately after
  // login without a second lookup-by-email round trip. Only the id is
  // returned — never the full Senior document (address, documents, etc.)
  // — the JWT and login response both stay minimal per the existing
  // security convention in this file.
  if (user.role === ROLES.SENIOR_CITIZEN) {
    const senior = await Senior.findOne({ userId: user._id }).select("_id");
    if (senior) {
      responseUser.seniorId = senior._id.toString();
    }
  }

  // Barangay Staff are scoped to a single barangay for verification
  // review — the frontend needs this to know which barangay's queue to
  // show, and verification.service.js already relies on the same field.
  if (user.role === ROLES.BARANGAY_STAFF && user.assignedBarangayId) {
    responseUser.barangayId = user.assignedBarangayId.toString();
  }

  return {
    accessToken,
    refreshToken,
    user: responseUser,
  };
}

export async function getAuthenticatedUser(userId) {
  const user = await User.findById(userId).populate("assignedBarangayId", "name municipality province");
  if (!user) throw new NotFoundError("Account not found.");

  const result = {
    id: user._id.toString(),
    email: user.email,
    role: user.role,
    status: user.status,
  };

  // Same resolution login() already performs — repeated here so a page
  // refresh (which calls /api/auth/me, not /api/auth/login) still shows
  // the staff member which Barangay they're assigned to. The backend
  // resolves this from the authenticated user's own record; the client
  // never supplies a barangay id.
  if (user.role === ROLES.BARANGAY_STAFF && user.assignedBarangayId) {
    result.barangayId = user.assignedBarangayId._id.toString();
    result.barangayName = user.assignedBarangayId.name;
    result.barangayMunicipality = user.assignedBarangayId.municipality;
    result.barangayProvince = user.assignedBarangayId.province;
  }

  if (user.role === ROLES.SENIOR_CITIZEN) {
    const senior = await Senior.findOne({ userId: user._id }).select("_id");
    if (senior) {
      result.seniorId = senior._id.toString();
    }
  }

  return result;
}

export async function requestPasswordReset(email) {
  const user = await User.findOne({ email: email.trim().toLowerCase() });

  // Always behave the same way whether or not the account exists.
  if (!user) return;

  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const expiresAt = Date.now() + 30 * 60 * 1000; // 30 minutes, single use

  resetTokenStore.set(tokenHash, {
    userId: user._id.toString(),
    expiresAt,
    used: false,
  });

  // In production, email `token` to the user via a transactional email
  // service. Never log or return the raw token to the API caller.
  return token;
}

export async function resetPassword({ token, newPassword }) {
  if (!isPasswordStrongEnough(newPassword)) {
    throw new ValidationError(
      "Password does not meet the minimum requirements.",
      {
        newPassword:
          "At least 8 characters, one uppercase letter, and one number.",
      },
    );
  }

  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const record = resetTokenStore.get(tokenHash);

  if (!record || record.used || record.expiresAt < Date.now()) {
    throw new AuthenticationError(
      "This password reset link is invalid or has expired.",
    );
  }

  const user = await User.findById(record.userId);
  if (!user)
    throw new AuthenticationError(
      "This password reset link is invalid or has expired.",
    );

  user.passwordHash = await hashPassword(newPassword);
  user.tokenVersion += 1; // invalidates any outstanding refresh tokens
  await user.save();

  record.used = true;
}
