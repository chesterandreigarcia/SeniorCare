import crypto from "node:crypto";
import Barangay from "../models/Barangay.js";
import User from "../models/User.js";
import Senior from "../models/Senior.js";
import { ROLES, ACCOUNT_STATUS } from "../utils/constants.js";
import { hashPassword } from "../utils/password.js";
import { NotFoundError, ConflictError, ValidationError } from "../utils/errors.js";

/**
 * Generates a secure random temporary password for a newly-provisioned
 * staff account when the admin doesn't supply one directly. Guaranteed to
 * satisfy the existing password policy (8+ chars, uppercase, number).
 */
function generateTemporaryPassword() {
  const raw = crypto.randomBytes(9).toString("base64url"); // ~12 chars, mixed case
  return `Sc${raw}1`; // prefix/suffix guarantee an uppercase letter + a digit
}

// ---------------------------------------------------------------------
// Barangays
// ---------------------------------------------------------------------

export async function createBarangay(data) {
  const barangay = await Barangay.create({
    name: data.name,
    municipality: data.municipality,
    province: data.province,
    code: data.code.toUpperCase(),
  });
  return barangay;
}

/**
 * Lists every Barangay along with real staff/senior counts pulled from
 * MongoDB — never hardcoded or estimated.
 */
export async function listBarangaysWithStats() {
  const barangays = await Barangay.find().sort({ name: 1 }).lean();

  const [staffCounts, seniorCounts] = await Promise.all([
    User.aggregate([
      { $match: { role: ROLES.BARANGAY_STAFF, assignedBarangayId: { $ne: null } } },
      { $group: { _id: "$assignedBarangayId", count: { $sum: 1 } } },
    ]),
    Senior.aggregate([{ $group: { _id: "$barangayId", count: { $sum: 1 } } }]),
  ]);

  const staffMap = new Map(staffCounts.map((s) => [s._id.toString(), s.count]));
  const seniorMap = new Map(seniorCounts.map((s) => [s._id.toString(), s.count]));

  return barangays.map((b) => ({
    ...b,
    staffCount: staffMap.get(b._id.toString()) || 0,
    seniorCount: seniorMap.get(b._id.toString()) || 0,
  }));
}

// ---------------------------------------------------------------------
// Barangay Staff
// ---------------------------------------------------------------------

async function assertBarangayExistsAndActive(barangayId) {
  const barangay = await Barangay.findById(barangayId);
  if (!barangay) throw new NotFoundError("Selected Barangay does not exist.");
  if (!barangay.isActive) {
    throw new ValidationError("Selected Barangay is not currently active.", {
      assignedBarangayId: "This Barangay is inactive.",
    });
  }
  return barangay;
}

/**
 * Creates a BARANGAY_STAFF account. `role` is never accepted from the
 * client — it's hardcoded here, the same pattern registration.service.js
 * already uses for SENIOR_CITIZEN accounts.
 */
export async function createStaffAccount(data) {
  await assertBarangayExistsAndActive(data.assignedBarangayId);

  const existing = await User.findOne({
    $or: [{ email: data.email }, ...(data.username ? [{ username: data.username }] : [])],
  });
  if (existing) {
    throw new ConflictError("An account with this email or username already exists.");
  }

  const temporaryPassword = data.password || generateTemporaryPassword();
  const passwordHash = await hashPassword(temporaryPassword);

  const user = await User.create({
    email: data.email,
    username: data.username,
    passwordHash,
    role: ROLES.BARANGAY_STAFF,
    status: data.status || ACCOUNT_STATUS.ACTIVE,
    assignedBarangayId: data.assignedBarangayId,
  });

  const populated = await User.findById(user._id).populate("assignedBarangayId", "name municipality province");

  return {
    user: populated,
    // Only returned once, at creation time — never persisted in plaintext,
    // never returned by any other endpoint. The admin is responsible for
    // securely relaying this to the staff member.
    temporaryPassword: data.password ? undefined : temporaryPassword,
  };
}

export async function listStaff() {
  return User.find({ role: ROLES.BARANGAY_STAFF })
    .populate("assignedBarangayId", "name municipality province")
    .sort({ createdAt: -1 });
}

export async function getStaffById(staffId) {
  const staff = await User.findOne({ _id: staffId, role: ROLES.BARANGAY_STAFF }).populate(
    "assignedBarangayId",
    "name municipality province"
  );
  if (!staff) throw new NotFoundError("Staff account not found.");
  return staff;
}

export async function updateStaffAssignment(staffId, assignedBarangayId) {
  await assertBarangayExistsAndActive(assignedBarangayId);

  const staff = await User.findOne({ _id: staffId, role: ROLES.BARANGAY_STAFF });
  if (!staff) throw new NotFoundError("Staff account not found.");

  staff.assignedBarangayId = assignedBarangayId;
  // Invalidate outstanding refresh tokens so the reassignment takes effect
  // immediately on their next login, consistent with how a password
  // change already forces re-authentication elsewhere in auth.service.js.
  staff.tokenVersion += 1;
  await staff.save();

  return User.findById(staff._id).populate("assignedBarangayId", "name municipality province");
}

export async function updateStaffStatus(staffId, status) {
  const staff = await User.findOne({ _id: staffId, role: ROLES.BARANGAY_STAFF });
  if (!staff) throw new NotFoundError("Staff account not found.");

  staff.status = status;
  staff.tokenVersion += 1; // deactivation should invalidate any active session immediately
  await staff.save();

  return User.findById(staff._id).populate("assignedBarangayId", "name municipality province");
}
