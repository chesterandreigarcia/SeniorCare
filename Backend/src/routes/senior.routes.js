import { Router } from "express";
import * as seniorController from "../controllers/senior.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { authorizeRoles } from "../middleware/role.middleware.js";
import { ROLES } from "../utils/constants.js";

const router = Router();

// Self-service only — there is no :id param anywhere in this router.
// The profile returned is always resolved from req.user.id (the
// authenticated token's own subject), so a Senior can never fetch
// another Senior's profile by supplying a different id.
router.get("/me", authenticate, authorizeRoles(ROLES.SENIOR_CITIZEN), seniorController.getMyProfile);

export default router;
