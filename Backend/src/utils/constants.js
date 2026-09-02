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
