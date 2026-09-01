import Senior from "../models/Senior.js";
import User from "../models/User.js";
import Guardian from "../models/Guardian.js";
import { NotFoundError } from "../utils/errors.js";

/**
 * Returns the authenticated Senior Citizen's own profile — never anyone
 * else's. `userId` always comes from `req.user.id` (set by the
 * `authenticate` middleware from the verified JWT + a fresh DB lookup),
 * never from a client-supplied id/param, so a Senior cannot request
 * another Senior's data by changing a URL or query string.
 *
 * This intentionally only returns what already exists in the current
 * data model (User + Senior + Barangay + Guardian). Pension, Benefits,
 * Applications, Announcements, Activities, and Notifications have no
 * backend module yet — the frontend renders empty states for those
 * rather than this service inventing placeholder data.
 */
export async function getMySeniorProfile(userId) {
  const user = await User.findById(userId);
  if (!user) throw new NotFoundError("Account not found.");

  const senior = await Senior.findOne({ userId: user._id }).populate(
    "barangayId",
    "name municipality province"
  );
  if (!senior) throw new NotFoundError("Senior profile not found.");

  let guardian = null;
  if (senior.guardianId) {
    const g = await Guardian.findById(senior.guardianId);
    if (g) {
      guardian = {
        firstName: g.firstName,
        lastName: g.lastName,
        relationship: g.relationship,
        mobileNumber: g.mobileNumber,
      };
    }
  }

  return {
    id: senior._id.toString(),
    accountStatus: user.status,
    seniorCitizenId: senior.seniorCitizenId || null,
    firstName: senior.firstName,
    middleName: senior.middleName,
    lastName: senior.lastName,
    suffix: senior.suffix,
    dateOfBirth: senior.dateOfBirth,
    age: senior.age,
    sex: senior.sex,
    civilStatus: senior.civilStatus,
    mobileNumber: senior.mobileNumber,
    email: senior.email || user.email,
    address: senior.address,
    bedridden: senior.bedridden,
    barangay: senior.barangayId
      ? {
          id: senior.barangayId._id.toString(),
          name: senior.barangayId.name,
          municipality: senior.barangayId.municipality,
          province: senior.barangayId.province,
        }
      : null,
    guardian,
  };
}
