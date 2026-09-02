import Senior from "../models/Senior.js";
import Guardian from "../models/Guardian.js";
import { ROLES } from "./constants.js";
import { AuthorizationError, NotFoundError } from "./errors.js";

/**
 * SENIORCARE — "who may act on behalf of this Senior" authorization.
 *
 * This is the single, isolated place that decides which Senior a request
 * is allowed to act for. Any module that lets a Senior (or, later, a
 * Guardian) manage their own records — Benefits & Assistance today,
 * potentially Pension or others later — should resolve the acting Senior
 * through `resolveActingSenior()` rather than trusting a client-supplied
 * `seniorId`/`userId` anywhere in the request body, params, or query.
 *
 * ── Current (active) behavior ──────────────────────────────────────
 * For `SENIOR_CITIZEN`, this is exactly the existing pattern already
 * used throughout the app (`Senior.findOne({ userId: req.user.id })`):
 * a Senior can only ever resolve to their own profile.
 *
 * ── Dormant (prepared, not reachable) behavior ─────────────────────
 * For `GUARDIAN`, the rule is already fully implemented below, but it
 * is NOT wired into anything a Guardian could reach today:
 *
 *   - No registration/admin flow anywhere in the codebase ever creates
 *     a User with role GUARDIAN (verified by inspecting
 *     registration.service.js and admin.service.js) — so no account
 *     that could hit this branch can currently be logged into.
 *   - There is no Guardian login page, dashboard, or protected route
 *     in the frontend (`App.jsx`) that would call an endpoint using
 *     this helper as a GUARDIAN.
 *
 * In other words: including ROLES.GUARDIAN in a route's
 * `authorizeRoles(...)` list today does not open anything up, because
 * nothing can currently authenticate as GUARDIAN. This lets a module
 * like Benefits & Assistance be "Guardian-ready" now, and activated
 * later purely by building Guardian registration/login/dashboard —
 * with ZERO changes required to this file or to the modules that call
 * it.
 *
 * The rule itself, once reachable, is intentionally strict and
 * bidirectional — both sides of the relationship must agree:
 *   1. A `Guardian` document must exist whose `userId` matches the
 *      authenticated user (i.e. this specific login is tied to this
 *      specific Guardian record).
 *   2. That Guardian record must have `authorizationConfirmed: true`
 *      (set only once Barangay Staff approved the guardian
 *      authorization documents during the Senior's verification —
 *      see verification.service.js). An unconfirmed/unverified
 *      Guardian relationship can never act for anyone.
 *   3. The target `Senior` must itself point back at that same
 *      Guardian via `senior.guardianId` — so a Guardian record that
 *      was superseded, reassigned, or never actually linked from the
 *      Senior side cannot be used to gain access.
 *
 * A Guardian can never widen this by supplying a different seniorId —
 * there is no seniorId parameter here at all; the Senior is always
 * derived server-side from the authenticated Guardian's own linked
 * record.
 */
export async function resolveActingSenior(requestingUser) {
  if (requestingUser.role === ROLES.SENIOR_CITIZEN) {
    const senior = await Senior.findOne({ userId: requestingUser.id });
    if (!senior) throw new NotFoundError("Senior profile not found.");
    return senior;
  }

  if (requestingUser.role === ROLES.GUARDIAN) {
    // Dormant: unreachable until a GUARDIAN-role account can be created
    // and logged in (see the module doc comment above). Implemented now
    // so activating Guardian access later needs no changes here.
    const guardian = await Guardian.findOne({
      userId: requestingUser.id,
      authorizationConfirmed: true,
    });
    if (!guardian) {
      throw new AuthorizationError("You are not authorized to act on behalf of a Senior Citizen.");
    }

    const senior = await Senior.findOne({ _id: guardian.seniorId, guardianId: guardian._id });
    if (!senior) {
      throw new AuthorizationError("You are not authorized to act on behalf of a Senior Citizen.");
    }

    return senior;
  }

  throw new AuthorizationError("Only a Senior Citizen (or their authorized Guardian) may perform this action.");
}

/**
 * Roles allowed to reach `resolveActingSenior` at the route level.
 * Exported as a single list so every Benefits route enables the same
 * (currently Senior-only-in-practice) set, and so activating Guardian
 * access later is a one-place change if it ever needs to be anything
 * other than "just add GUARDIAN to authorizeRoles", which is already
 * done here.
 */
export const SENIOR_OR_GUARDIAN_ROLES = [ROLES.SENIOR_CITIZEN, ROLES.GUARDIAN];
