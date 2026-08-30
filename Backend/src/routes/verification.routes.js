import { Router } from "express";
import * as verificationController from "../controllers/verification.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { authorizeRoles } from "../middleware/role.middleware.js";
import { validateBody } from "../middleware/validation.middleware.js";
import { approveVerificationSchema, rejectVerificationSchema } from "../validators/verification.validator.js";
import { ROLES } from "../utils/constants.js";

const router = Router();

const staffOrAbove = authorizeRoles(ROLES.BARANGAY_STAFF, ROLES.ADMIN, ROLES.LGU_OSCA);

router.get("/pending", authenticate, staffOrAbove, verificationController.listPending);
router.get("/:id", authenticate, staffOrAbove, verificationController.getOne);
router.patch(
  "/:id/approve",
  authenticate,
  staffOrAbove,
  validateBody(approveVerificationSchema),
  verificationController.approve
);
router.patch(
  "/:id/reject",
  authenticate,
  staffOrAbove,
  validateBody(rejectVerificationSchema),
  verificationController.reject
);

export default router;
