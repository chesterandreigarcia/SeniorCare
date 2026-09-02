import { api, toApiError } from "../utils/api.js";

/**
 * Senior self-service pension API.
 * Backend: pension.routes.js / pensionSchedule.routes.js / pensionClaim.routes.js
 * All endpoints resolve the Senior from the authenticated token — there is
 * no seniorId anywhere in these calls for a Senior to tamper with.
 */

export async function getMyPension() {
  try {
    const res = await api.get("/pensions/me");
    return res.data?.data || null;
  } catch (err) {
    throw toApiError(err);
  }
}

/** Currently bookable (OPEN, upcoming) claiming schedules for the Senior's own Barangay. */
export async function getMyBarangaySchedules() {
  try {
    const res = await api.get("/pension-schedules/me");
    return res.data?.data || [];
  } catch (err) {
    throw toApiError(err);
  }
}

export async function getMyUpcomingClaim() {
  try {
    const res = await api.get("/pension-claims/me/upcoming");
    return res.data?.data || null;
  } catch (err) {
    throw toApiError(err);
  }
}

export async function getMyClaimHistory() {
  try {
    const res = await api.get("/pension-claims/me/history");
    return res.data?.data || [];
  } catch (err) {
    throw toApiError(err);
  }
}

export async function getMyClaimQr(claimId) {
  try {
    const res = await api.get(`/pension-claims/me/${claimId}/qr`);
    return res.data?.data; // { claim, qrDataUrl }
  } catch (err) {
    throw toApiError(err);
  }
}

export async function bookClaimingSlot({ scheduleId, slotId }) {
  try {
    const res = await api.post("/pension-claims", { scheduleId, slotId });
    return res.data?.data;
  } catch (err) {
    throw toApiError(err);
  }
}

export async function cancelClaimingBooking(claimId) {
  try {
    const res = await api.post(`/pension-claims/${claimId}/cancel`);
    return res.data?.data;
  } catch (err) {
    throw toApiError(err);
  }
}
