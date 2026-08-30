import mongoose from "mongoose";
import { SEX, CIVIL_STATUS } from "../utils/constants.js";

// Senior profile information only. Deliberately excludes pension amounts,
// pension/claiming history, assistance history, and application status —
// those belong to other SENIORCARE modules created after verification.

const addressSchema = new mongoose.Schema(
  {
    houseLotBlock: { type: String, trim: true, default: "" },
    street: { type: String, trim: true, required: true },
    sitio: { type: String, trim: true, default: "" },
    purok: { type: String, trim: true, default: "" },
    municipality: { type: String, trim: true, required: true },
    province: { type: String, trim: true, default: "" },
    postalCode: { type: String, trim: true, default: "" },
  },
  { _id: false }
);

const seniorSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    barangayId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Barangay",
      required: true,
      index: true,
    },

    firstName: { type: String, required: true, trim: true, maxlength: 100 },
    middleName: { type: String, trim: true, maxlength: 100, default: "" },
    lastName: { type: String, required: true, trim: true, maxlength: 100 },
    suffix: { type: String, trim: true, maxlength: 10, default: "" },

    dateOfBirth: { type: Date, required: true },
    sex: { type: String, enum: Object.values(SEX), required: true },
    civilStatus: { type: String, enum: Object.values(CIVIL_STATUS), required: true },

    // Optional — a senior may not yet hold a physical ID at registration time.
    seniorCitizenId: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
    },

    mobileNumber: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true, default: "" },

    address: { type: addressSchema, required: true },

    bedridden: { type: Boolean, required: true, default: false },

    // Reference to an authorized guardian/representative, if provided.
    guardianId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Guardian",
      default: null,
    },
  },
  { timestamps: true }
);

seniorSchema.index({ userId: 1 }, { unique: true });
seniorSchema.index({ seniorCitizenId: 1 }, { unique: true, sparse: true });
seniorSchema.index({ barangayId: 1 });

// Virtual, server-computed age — never trust a client-supplied age.
seniorSchema.virtual("age").get(function () {
  if (!this.dateOfBirth) return null;
  const today = new Date();
  const dob = new Date(this.dateOfBirth);
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
  return age;
});

seniorSchema.set("toJSON", { virtuals: true });

export default mongoose.model("Senior", seniorSchema);
