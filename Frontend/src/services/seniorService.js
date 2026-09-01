import { api, toApiError } from "../utils/api.js";

/**
 * GET /api/seniors/me
 * Backend: senior.routes.js -> senior.controller.js -> senior.service.js
 * Always resolves to the authenticated Senior's own profile (the backend
 * derives the id from the verified access token, not from anything this
 * client sends) — there is no seniorId parameter to tamper with.
 *
 * Returns: { id, accountStatus, seniorCitizenId, firstName, middleName,
 *   lastName, suffix, dateOfBirth, age, sex, civilStatus, mobileNumber,
 *   email, address, bedridden, barangay: { name, municipality, province },
 *   guardian: { firstName, lastName, relationship, mobileNumber } | null }
 */
export async function getMyProfile() {
  try {
    const res = await api.get("/seniors/me");
    return res.data.data;
  } catch (err) {
    throw toApiError(err);
  }
}
