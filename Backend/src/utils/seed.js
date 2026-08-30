// Development-only seed script. Do NOT run against a production database.
// Usage: npm run seed

import "dotenv/config";
import { connectDatabase, disconnectDatabase } from "../config/database.js";
import Barangay from "../models/Barangay.js";
import User from "../models/User.js";
import { hashPassword } from "./password.js";
import { ROLES, ACCOUNT_STATUS } from "./constants.js";

const SAMPLE_BARANGAYS = [
  { name: "Barangay San Isidro", municipality: "Sample Municipality", province: "Sample Province", code: "BSI01" },
  { name: "Barangay Santa Cruz", municipality: "Sample Municipality", province: "Sample Province", code: "BSC01" },
  { name: "Barangay Poblacion", municipality: "Sample Municipality", province: "Sample Province", code: "BPB01" },
];

async function seed() {
  await connectDatabase();
  console.log("[seed] connected. Seeding development data...");

  const barangays = [];
  for (const b of SAMPLE_BARANGAYS) {
    const existing = await Barangay.findOneAndUpdate(
      { code: b.code },
      { $setOnInsert: b },
      { upsert: true, new: true }
    );
    barangays.push(existing);
    console.log(`[seed] barangay ready: ${existing.name}`);
  }

  // Development-only admin account. Clearly labeled test credentials —
  // change or remove before any real deployment.
  const adminEmail = "dev-admin@seniorcare.test";
  const existingAdmin = await User.findOne({ email: adminEmail });
  if (!existingAdmin) {
    await User.create({
      email: adminEmail,
      passwordHash: await hashPassword("DevAdmin123"),
      role: ROLES.ADMIN,
      status: ACCOUNT_STATUS.ACTIVE,
    });
    console.log(`[seed] created development admin: ${adminEmail} / DevAdmin123 (TEST ACCOUNT — do not use in production)`);
  } else {
    console.log("[seed] development admin already exists, skipping.");
  }

  // Development-only barangay staff account, scoped to the first barangay.
  const staffEmail = "dev-staff@seniorcare.test";
  const existingStaff = await User.findOne({ email: staffEmail });
  if (!existingStaff) {
    await User.create({
      email: staffEmail,
      passwordHash: await hashPassword("DevStaff123"),
      role: ROLES.BARANGAY_STAFF,
      status: ACCOUNT_STATUS.ACTIVE,
      assignedBarangayId: barangays[0]._id,
    });
    console.log(`[seed] created development staff: ${staffEmail} / DevStaff123 (TEST ACCOUNT — scoped to ${barangays[0].name})`);
  } else {
    console.log("[seed] development staff already exists, skipping.");
  }

  console.log("[seed] done.");
  await disconnectDatabase();
  process.exit(0);
}

seed().catch((err) => {
  console.error("[seed] failed:", err);
  process.exit(1);
});
