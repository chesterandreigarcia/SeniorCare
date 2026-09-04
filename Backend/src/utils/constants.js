// Central place for enums used across models, validators, and middleware.
// Keeping these as plain objects (not free-typed strings) prevents typos
// from creating silently-broken authorization checks.

export const ROLES = Object.freeze({
  SENIOR_CITIZEN: "SENIOR_CITIZEN",
  GUARDIAN: "GUARDIAN",
  BARANGAY_STAFF: "BARANGAY_STAFF",
  ADMIN: "ADMIN",
  LGU_OSCA: "LGU_OSCA",
});

export const ACCOUNT_STATUS = Object.freeze({
  PENDING_VERIFICATION: "PENDING_VERIFICATION",
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
  REJECTED: "REJECTED",
});

export const VERIFICATION_STATUS = Object.freeze({
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
});

export const SEX = Object.freeze({
  MALE: "Male",
  FEMALE: "Female",
});

export const CIVIL_STATUS = Object.freeze({
  SINGLE: "Single",
  MARRIED: "Married",
  WIDOWED: "Widowed",
  DIVORCED: "Divorced",
  SEPARATED: "Separated",
});

export const DOCUMENT_TYPES = Object.freeze({
  VALID_ID: "VALID_ID",
  SENIOR_CITIZEN_ID: "SENIOR_CITIZEN_ID",
  PROOF_OF_RESIDENCY: "PROOF_OF_RESIDENCY",
  GUARDIAN_ID: "GUARDIAN_ID",
  AUTHORIZATION_DOCUMENT: "AUTHORIZATION_DOCUMENT",
  // Additive — used only by Benefit Applications for program-specific
  // requirements beyond the fixed set collected at registration.
  BENEFIT_SUPPORTING_DOCUMENT: "BENEFIT_SUPPORTING_DOCUMENT",
});

export const RELATIONSHIP_TYPES = Object.freeze({
  CHILD: "Child",
  SPOUSE: "Spouse",
  SIBLING: "Sibling",
  RELATIVE: "Relative",
  CAREGIVER: "Caregiver",
  OTHER: "Other",
});

// Minimum age to be eligible for SENIORCARE registration.
// Adjust to the organization's actual policy — kept as a single
// source of truth rather than scattered magic numbers.
export const MINIMUM_SENIOR_AGE = 60;

// ---- Pension Management ----

export const PENSION_TYPES = Object.freeze({
  GOVERNMENT_PENSION: "GOVERNMENT_PENSION",
  SOCIAL_PENSION: "SOCIAL_PENSION",
  OTHER: "OTHER",
});

export const PENSION_FREQUENCY = Object.freeze({
  MONTHLY: "MONTHLY",
  QUARTERLY: "QUARTERLY",
  ANNUAL: "ANNUAL",
});

export const PENSION_STATUS = Object.freeze({
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
});

export const SCHEDULE_STATUS = Object.freeze({
  OPEN: "OPEN",
  CLOSED: "CLOSED",
});

export const SLOT_STATUS = Object.freeze({
  AVAILABLE: "AVAILABLE",
  FULL: "FULL",
  CLOSED: "CLOSED",
});

export const CLAIM_STATUS = Object.freeze({
  SCHEDULED: "SCHEDULED",
  CLAIMED: "CLAIMED",
  MISSED: "MISSED",
  CANCELLED: "CANCELLED",
});

// ---- Benefits & Assistance Management ----

export const BENEFIT_CATEGORY = Object.freeze({
  AGE_BASED: "AGE_BASED",
  FINANCIAL_ASSISTANCE: "FINANCIAL_ASSISTANCE",
  OTHER: "OTHER",
});

export const BENEFIT_STATUS = Object.freeze({
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
});

// The Senior lifecycle a benefit application moves through. Rejection is
// reachable from SUBMITTED/UNDER_REVIEW/ENDORSED (see the transition
// rules in benefitApplication.service.js) — it is not a step in this
// straight-line list, just a valid destination from those three.
export const APPLICATION_STATUS = Object.freeze({
  SUBMITTED: "SUBMITTED",
  UNDER_REVIEW: "UNDER_REVIEW",
  ENDORSED: "ENDORSED",
  APPROVED: "APPROVED",
  RELEASED: "RELEASED",
  CLAIMED: "CLAIMED",
  REJECTED: "REJECTED",
});

// ---- Announcements & Notifications ----

export const ANNOUNCEMENT_CATEGORY = Object.freeze({
  GENERAL: "GENERAL",
  PENSION: "PENSION",
  BENEFITS: "BENEFITS",
  ASSISTANCE: "ASSISTANCE",
  REQUIREMENTS: "REQUIREMENTS",
  PROGRAM: "PROGRAM",
  BARANGAY: "BARANGAY",
  ACTIVITY: "ACTIVITY",
  IMPORTANT: "IMPORTANT",
});

export const ANNOUNCEMENT_STATUS = Object.freeze({
  DRAFT: "DRAFT",
  PUBLISHED: "PUBLISHED",
  ARCHIVED: "ARCHIVED",
});

// Who an announcement is meant for. ALL means every authenticated,
// active role (Senior/Guardian/Staff/Admin/LGU-OSCA all see it, still
// subject to barangay scoping below) — it does NOT bypass barangay
// scoping on its own. STAFF_ADMIN groups the internal-only audiences
// (BARANGAY_STAFF/ADMIN/LGU_OSCA) since Seniors/Guardians must never
// see staff-only announcements.
export const TARGET_AUDIENCE = Object.freeze({
  ALL: "ALL",
  SENIOR_CITIZEN: "SENIOR_CITIZEN",
  GUARDIAN: "GUARDIAN",
  STAFF_ADMIN: "STAFF_ADMIN",
});

// Whether an announcement applies system-wide or only to specific
// Barangay(s) — mirrors BenefitProgram.barangayIds' "empty = everyone"
// convention rather than inventing a second scoping concept.
export const ANNOUNCEMENT_SCOPE = Object.freeze({
  SYSTEM_WIDE: "SYSTEM_WIDE",
  BARANGAY: "BARANGAY",
});

export const NOTIFICATION_TYPE = Object.freeze({
  ANNOUNCEMENT: "ANNOUNCEMENT",
  PENSION: "PENSION",
  BENEFIT: "BENEFIT",
  DOCUMENT: "DOCUMENT",
  APPLICATION: "APPLICATION",
  ACTIVITY: "ACTIVITY",
  SYSTEM: "SYSTEM",
});

// ---- Social Activities ----
// A distinct lifecycle from ANNOUNCEMENT_STATUS — an activity is a
// scheduled, physical event (it can be ONGOING/COMPLETED), not a
// broadcast notice, so the two statuses are intentionally not shared.
export const ACTIVITY_STATUS = Object.freeze({
  DRAFT: "DRAFT",
  PUBLISHED: "PUBLISHED",
  ONGOING: "ONGOING",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
});

export const ACTIVITY_CATEGORY = Object.freeze({
  WELLNESS: "WELLNESS",
  ASSEMBLY: "ASSEMBLY",
  HEALTH_SEMINAR: "HEALTH_SEMINAR",
  EXERCISE: "EXERCISE",
  COMMUNITY_EVENT: "COMMUNITY_EVENT",
  LIVELIHOOD: "LIVELIHOOD",
  GENERAL: "GENERAL",
});
