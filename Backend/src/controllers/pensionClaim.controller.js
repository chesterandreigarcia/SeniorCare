import * as claimService from "../services/pensionClaim.service.js";

export async function bookSlot(req, res, next) {
  try {
    const claim = await claimService.bookSlot(req.user.id, req.validatedBody);
    res.status(201).json({ success: true, data: claim });
  } catch (err) {
    next(err);
  }
}

export async function getMyUpcomingClaim(req, res, next) {
  try {
    const claim = await claimService.getMyUpcomingClaim(req.user.id);
    res.status(200).json({ success: true, data: claim });
  } catch (err) {
    next(err);
  }
}

export async function getMyClaimHistory(req, res, next) {
  try {
    const history = await claimService.getMyClaimHistory(req.user.id);
    res.status(200).json({ success: true, data: history });
  } catch (err) {
    next(err);
  }
}

export async function getMyClaimQr(req, res, next) {
  try {
    const { claim, qrDataUrl } = await claimService.getMyClaimQr(req.user.id, req.params.id);
    res.status(200).json({ success: true, data: { claim, qrDataUrl } });
  } catch (err) {
    next(err);
  }
}

export async function listClaims(req, res, next) {
  try {
    const { barangayId, scheduleId, date } = req.query;
    const claims = await claimService.listClaimsForBarangay(req.user, { barangayId, scheduleId, date });
    res.status(200).json({ success: true, data: claims });
  } catch (err) {
    next(err);
  }
}

// Step 1: resolve a scanned/entered QR token to claim info for Staff to
// review. Never changes the claim's status — see pensionClaim.service.js.
export async function resolveClaim(req, res, next) {
  try {
    const claim = await claimService.resolveClaimByToken(req.user, req.validatedBody.qrToken);
    res.status(200).json({ success: true, data: claim });
  } catch (err) {
    next(err);
  }
}

// Step 2: Staff explicitly confirms the claim that was just resolved,
// which is the only place a claim actually becomes CLAIMED.
export async function confirmClaim(req, res, next) {
  try {
    const claim = await claimService.confirmClaim(req.user, req.validatedBody.qrToken);
    res.status(200).json({ success: true, data: claim });
  } catch (err) {
    next(err);
  }
}

export async function cancelClaim(req, res, next) {
  try {
    const claim = await claimService.cancelClaim(req.user.id, req.params.id);
    res.status(200).json({ success: true, data: claim });
  } catch (err) {
    next(err);
  }
}
