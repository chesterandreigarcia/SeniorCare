import { jest } from "@jest/globals";
import { setupTestDatabase, teardownTestDatabase, clearCollections } from "./setup.js";
import Barangay from "../src/models/Barangay.js";
import User from "../src/models/User.js";
import Senior from "../src/models/Senior.js";
import Verification from "../src/models/Verification.js";
import { registerSenior } from "../src/services/registration.service.js";
import { login } from "../src/services/auth.service.js";
import { approveVerification, rejectVerification, listPendingVerifications } from "../src/services/verification.service.js";
import { ACCOUNT_STATUS, ROLES } from "../src/utils/constants.js";
import { hashPassword } from "../src/utils/password.js";

jest.setTimeout(30000);

let barangay, otherBarangay;

beforeAll(async () => {
  await setupTestDatabase();
});

afterAll(async () => {
  await teardownTestDatabase();
});

beforeEach(async () => {
  await clearCollections();
  barangay = await Barangay.create({ name: "Barangay A", municipality: "M", province: "P", code: "BA01" });
  otherBarangay = await Barangay.create({ name: "Barangay B", municipality: "M", province: "P", code: "BB01" });
});

function baseRegistration(overrides = {}) {
  return {
    barangayId: barangay._id.toString(),
    firstName: "Maria",
    lastName: "Santos",
    dateOfBirth: "1945-05-05",
    sex: "Female",
    civilStatus: "Widowed",
    mobileNumber: "9171234567",
    address: { street: "Purok 2", municipality: "M" },
    bedridden: false,
    accountEmail: "maria@example.com",
    password: "Password1",
    ...overrides,
  };
}

async function makeStaff(assignedBarangay) {
  const user = await User.create({
    email: `staff-${assignedBarangay._id}@example.com`,
    passwordHash: await hashPassword("StaffPass1"),
    role: ROLES.BARANGAY_STAFF,
    status: ACCOUNT_STATUS.ACTIVE,
    assignedBarangayId: assignedBarangay._id,
  });
  return { id: user._id.toString(), role: user.role, assignedBarangayId: assignedBarangay._id.toString() };
}

test("login fails for pending account with ACCOUNT_PENDING_VERIFICATION", async () => {
  await registerSenior(baseRegistration());
  await expect(login({ emailOrUsername: "maria@example.com", password: "Password1" })).rejects.toMatchObject({
    code: "ACCOUNT_PENDING_VERIFICATION",
  });
});

test("login fails with generic message for wrong password", async () => {
  await registerSenior(baseRegistration());
  await expect(login({ emailOrUsername: "maria@example.com", password: "WrongPass1" })).rejects.toMatchObject({
    message: "Invalid email or password.",
  });
});

test("login fails with generic message for unknown user", async () => {
  await expect(login({ emailOrUsername: "nobody@example.com", password: "Whatever1" })).rejects.toMatchObject({
    message: "Invalid email or password.",
  });
});

test("approving a verification activates the account and allows login", async () => {
  const result = await registerSenior(baseRegistration());
  const staff = await makeStaff(barangay);

  const verification = await Verification.findById(result.verificationId);
  await approveVerification(verification._id, staff, { remarks: "Looks good." });

  const user = await User.findById(result.userId);
  expect(user.status).toBe(ACCOUNT_STATUS.ACTIVE);

  const loginResult = await login({ emailOrUsername: "maria@example.com", password: "Password1" });
  expect(loginResult.user.role).toBe(ROLES.SENIOR_CITIZEN);
});

test("rejecting a verification sets the account to REJECTED and blocks login", async () => {
  const result = await registerSenior(baseRegistration({ accountEmail: "reject-me@example.com" }));
  const staff = await makeStaff(barangay);
  const verification = await Verification.findById(result.verificationId);

  await rejectVerification(verification._id, staff, { reason: "Documents unreadable." });

  const user = await User.findById(result.userId);
  expect(user.status).toBe(ACCOUNT_STATUS.REJECTED);

  await expect(
    login({ emailOrUsername: "reject-me@example.com", password: "Password1" })
  ).rejects.toMatchObject({ code: "ACCOUNT_REJECTED" });
});

test("staff cannot approve a verification outside their assigned barangay", async () => {
  const result = await registerSenior(baseRegistration({ accountEmail: "scoped@example.com" }));
  const staffForOtherBarangay = await makeStaff(otherBarangay);
  const verification = await Verification.findById(result.verificationId);

  await expect(approveVerification(verification._id, staffForOtherBarangay, {})).rejects.toMatchObject({
    statusCode: 403,
  });
});

test("staff only sees pending verifications for their assigned barangay", async () => {
  await registerSenior(baseRegistration({ accountEmail: "a1@example.com" }));
  await registerSenior(
    baseRegistration({ barangayId: otherBarangay._id.toString(), accountEmail: "a2@example.com" })
  );

  const staffA = await makeStaff(barangay);
  const pendingForA = await listPendingVerifications(staffA);

  expect(pendingForA).toHaveLength(1);
  expect(pendingForA[0].barangayId._id.toString()).toBe(barangay._id.toString());
});

test("a normal senior citizen cannot approve their own verification (role check)", async () => {
  const result = await registerSenior(baseRegistration({ accountEmail: "self-approve@example.com" }));
  const seniorUser = await User.findById(result.userId);
  const fakeSeniorActor = { id: seniorUser._id.toString(), role: ROLES.SENIOR_CITIZEN, assignedBarangayId: null };
  const verification = await Verification.findById(result.verificationId);

  // Service layer itself doesn't check role — that's the role middleware's
  // job at the route layer. This test documents that the middleware, not
  // the service, is the enforcement point, and confirms scoping still
  // fails closed for an actor with no assigned barangay.
  await expect(approveVerification(verification._id, fakeSeniorActor, {})).rejects.toMatchObject({
    statusCode: 403,
  });
});
