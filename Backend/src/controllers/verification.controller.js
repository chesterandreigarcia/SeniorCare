import * as verificationService from "../services/verification.service.js";

export async function listPending(req, res, next) {
  try {
    const results = await verificationService.listPendingVerifications(req.user);
    res.status(200).json({ success: true, data: results });
  } catch (err) {
    next(err);
  }
}

export async function getOne(req, res, next) {
  try {
    const result = await verificationService.getVerificationById(req.params.id, req.user);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function approve(req, res, next) {
  try {
    const result = await verificationService.approveVerification(req.params.id, req.user, req.validatedBody);
    res.status(200).json({ success: true, message: "Registration approved. The account is now active.", data: result });
  } catch (err) {
    next(err);
  }
}

export async function reject(req, res, next) {
  try {
    const result = await verificationService.rejectVerification(req.params.id, req.user, req.validatedBody);
    res.status(200).json({ success: true, message: "Registration rejected.", data: result });
  } catch (err) {
    next(err);
  }
}
