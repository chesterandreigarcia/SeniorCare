import mongoose from "mongoose";

/**
 * Minimal illness/medical-condition list — Phase 3 only needs something
 * for the registration dropdown to reference. The Admin-managed Illness
 * Database (classification, priority, CRUD UI) is Phase 4 and will extend
 * this model; nothing here classifies or prioritizes an illness.
 */
const illnessSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 150 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

illnessSchema.index({ name: 1 }, { unique: true });

export default mongoose.model("Illness", illnessSchema);
