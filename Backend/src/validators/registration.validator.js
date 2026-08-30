import { z } from "zod";
import mongoose from "mongoose";
import { SEX, CIVIL_STATUS, RELATIONSHIP_TYPES } from "../utils/constants.js";

const objectId = z.string().refine((v) => mongoose.Types.ObjectId.isValid(v), {
  message: "Invalid identifier.",
});

const addressSchema = z.object({
  houseLotBlock: z.string().trim().max(200).optional().default(""),
  street: z.string().trim().min(1, "Street / Sitio / Purok is required.").max(200),
  sitio: z.string().trim().max(200).optional().default(""),
  purok: z.string().trim().max(200).optional().default(""),
  municipality: z.string().trim().min(1, "Municipality / City is required.").max(200),
  province: z.string().trim().max(200).optional().default(""),
  postalCode: z.string().trim().max(20).optional().default(""),
});

const guardianSchema = z
  .object({
    hasGuardian: z.boolean(),
    firstName: z.string().trim().min(1).max(100).optional(),
    lastName: z.string().trim().min(1).max(100).optional(),
    middleName: z.string().trim().max(100).optional().default(""),
    suffix: z.string().trim().max(10).optional().default(""),
    relationship: z.nativeEnum(RELATIONSHIP_TYPES).optional(),
    mobileNumber: z.string().trim().optional(),
    email: z.string().trim().email().optional().or(z.literal("")).default(""),
    address: z.string().trim().max(300).optional().default(""),
    idType: z.string().trim().max(100).optional().default(""),
    idNumber: z.string().trim().max(100).optional().default(""),
  })
  .superRefine((data, ctx) => {
    if (!data.hasGuardian) return;
    if (!data.firstName) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Guardian first name is required.", path: ["firstName"] });
    }
    if (!data.lastName) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Guardian last name is required.", path: ["lastName"] });
    }
    if (!data.relationship) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Guardian relationship is required.", path: ["relationship"] });
    }
    if (!data.mobileNumber) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Guardian mobile number is required.", path: ["mobileNumber"] });
    }
  });

export const registrationSchema = z.object({
  barangayId: objectId,

  firstName: z.string().trim().min(1, "First name is required.").max(100),
  middleName: z.string().trim().max(100).optional().default(""),
  lastName: z.string().trim().min(1, "Last name is required.").max(100),
  suffix: z.string().trim().max(10).optional().default(""),

  dateOfBirth: z
    .string()
    .refine((v) => !Number.isNaN(Date.parse(v)), "Please provide a valid date of birth.")
    .refine((v) => new Date(v).getTime() <= Date.now(), "Date of birth cannot be in the future."),

  sex: z.nativeEnum(SEX, { errorMap: () => ({ message: "Please select a valid sex." }) }),
  civilStatus: z.nativeEnum(CIVIL_STATUS, { errorMap: () => ({ message: "Please select a valid civil status." }) }),

  seniorCitizenId: z.string().trim().max(50).optional().default(""),

  mobileNumber: z
    .string()
    .trim()
    .regex(/^(\+?63|0)?9\d{9}$/, "Please enter a valid Philippine mobile number."),
  email: z.string().trim().email("Please enter a valid email address.").optional().or(z.literal("")).default(""),

  address: addressSchema,

  bedridden: z.boolean({ invalid_type_error: "Bedridden status must be true or false." }),

  guardian: guardianSchema.optional(),

  accountEmail: z.string().trim().email("Please enter a valid email address."),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter.")
    .regex(/\d/, "Password must contain at least one number."),
});
