import * as registrationService from "../services/registration.service.js";
import { DOCUMENT_TYPES } from "../utils/constants.js";

export async function register(req, res, next) {
  try {
    // req.validatedBody is set by the validateBody middleware.
    // req.files is populated by the upload middleware (multer.fields).
    const files = req.files || {};
    const uploadedFiles = {
      VALID_ID: files.validId?.[0],
      SENIOR_CITIZEN_ID: files.seniorCitizenId?.[0],
      PROOF_OF_RESIDENCY: files.proofResidency?.[0],
      GUARDIAN_ID: files.guardianId?.[0],
      AUTHORIZATION_DOCUMENT: files.guardianAuthDoc?.[0],
    };

    const result = await registrationService.registerSenior(req.validatedBody, uploadedFiles);

    res.status(201).json({
      success: true,
      message: "Registration submitted successfully. Your account is pending barangay verification.",
      data: {
        status: "PENDING_VERIFICATION",
        seniorId: result.seniorId,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function getBarangays(_req, res, next) {
  try {
    const barangays = await registrationService.listActiveBarangays();
    res.status(200).json({ success: true, data: barangays });
  } catch (err) {
    next(err);
  }
}

// Referenced for completeness of the DOCUMENT_TYPES import (used by other
// modules); not directly used here but kept for symmetry with the service.
void DOCUMENT_TYPES;
