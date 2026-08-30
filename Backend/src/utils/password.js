import bcrypt from "bcryptjs";

// bcrypt cost factor. 12 is a reasonable balance of security vs. latency
// for an interactive login endpoint as of 2026 hardware.
const SALT_ROUNDS = 12;

export async function hashPassword(plainPassword) {
  return bcrypt.hash(plainPassword, SALT_ROUNDS);
}

export async function verifyPassword(plainPassword, passwordHash) {
  return bcrypt.compare(plainPassword, passwordHash);
}

// Server-side password policy — mirrors (but does not trust) the
// frontend's displayed requirements.
export function isPasswordStrongEnough(plainPassword) {
  if (typeof plainPassword !== "string") return false;
  if (plainPassword.length < 8) return false;
  if (!/[A-Z]/.test(plainPassword)) return false;
  if (!/\d/.test(plainPassword)) return false;
  return true;
}
