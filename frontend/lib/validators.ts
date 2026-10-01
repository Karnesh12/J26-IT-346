import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid institution email address."),
  password: z.string().min(8, "Password must be at least 8 characters.").max(72, "Password must be 72 characters or fewer."),
});

export const accessRequestSchema = z.object({
  name: z.string().trim().min(2, "Enter your full name."),
  email: z.string().trim().email("Enter a valid institution email address."),
  institution: z.string().trim().min(2, "Enter your institution."),
  role: z.enum(["researcher", "reviewer"], { errorMap: () => ({ message: "Choose a role." }) }),
  reason: z.string().trim().min(20, "Please provide at least 20 characters.").max(1000, "Please keep your response under 1,000 characters."),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
});

export const otpSchema = z.object({
  code: z.string().regex(/^\d{6}$/, "Enter the 6-digit verification code."),
});

export type LoginValues = z.infer<typeof loginSchema>;
export type AccessRequestValues = z.infer<typeof accessRequestSchema>;
