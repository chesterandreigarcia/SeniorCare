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
