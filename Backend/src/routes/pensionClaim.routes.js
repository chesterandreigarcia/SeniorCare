import { Router } from "express";
import * as claimController from "../controllers/pensionClaim.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { authorizeRoles } from "../middleware/role.middleware.js";
import { validateBody } from "../middleware/validation.middleware.js";
import { bookSlotSchema, verifyClaimSchema } from "../validators/pension.validator.js";
import { ROLES } from "../utils/constants.js";

const router = Router();

const staffOrAbove = authorizeRoles(ROLES.BARANGAY_STAFF, ROLES.ADMIN, ROLES.LGU_OSCA);
const seniorOnly = authorizeRoles(ROLES.SENIOR_CITIZEN);

// Senior self-service.
router.post("/", authenticate, seniorOnly, validateBody(bookSlotSchema), claimController.bookSlot);
router.get("/me/upcoming", authenticate, seniorOnly, claimController.getMyUpcomingClaim);
router.get("/me/history", authenticate, seniorOnly, claimController.getMyClaimHistory);
router.get("/me/:id/qr", authenticate, seniorOnly, claimController.getMyClaimQr);
router.post("/:id/cancel", authenticate, seniorOnly, claimController.cancelClaim);

// Barangay Staff / Admin / LGU-OSCA.
router.get("/", authenticate, staffOrAbove, claimController.listClaims);
// Step 1: resolve the scanned/entered QR token — read-only, for review.
router.post("/verify", authenticate, staffOrAbove, validateBody(verifyClaimSchema), claimController.resolveClaim);
// Step 2: explicit Staff confirmation — the only path that sets CLAIMED.
router.post("/confirm", authenticate, staffOrAbove, validateBody(verifyClaimSchema), claimController.confirmClaim);

export default router;
