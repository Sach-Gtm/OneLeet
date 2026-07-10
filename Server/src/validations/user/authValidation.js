const { z } = require("zod");

const emailField = z
    .string({ required_error: "Email is required" })
    .trim()
    .toLowerCase()
    .email("Please provide a valid email address");

const registerSchema = z.object({
    name: z
        .string({ required_error: "Name is required" })
        .trim()
        .min(2, "Name must be at least 2 characters")
        .max(50, "Name cannot be more than 50 characters"),
    email: emailField,
    password: z
        .string({ required_error: "Password is required" })
        .min(6, "Password must be at least 6 characters")
        .max(72, "Password cannot be more than 72 characters"),
    role: z.enum(["student", "teacher"]).default("student"),
    phone: z
        .string({ required_error: "Phone number is required" })
        .trim()
        .min(10, "Enter a valid phone number")
        .max(20, "Phone number too long")
        .regex(/^\+?[0-9][0-9\s-]{8,}$/, "Enter a valid phone number"),
    avatar: z.string().url("Avatar must be a valid URL").optional().or(z.literal("")),
});

const verifyOtpSchema = z.object({
    email: emailField,
    otp: z
        .string({ required_error: "Enter the 6-digit code" })
        .trim()
        .regex(/^\d{6}$/, "Code must be 6 digits"),
});

const resendOtpSchema = z.object({ email: emailField });

const loginSchema = z.object({
    email: emailField,
    password: z.string({ required_error: "Password is required" }).min(1, "Password is required"),
});

const forgotPasswordSchema = z.object({
    email: emailField,
});

const resetPasswordSchema = z.object({
    password: z
        .string({ required_error: "Password is required" })
        .min(6, "Password must be at least 6 characters")
        .max(72, "Password cannot be more than 72 characters"),
});

const optionalCapped = (max) => z.string().trim().max(max).optional().or(z.literal(""));

const updateProfileSchema = z.object({
    name: z.string().trim().min(2, "Name must be at least 2 characters").max(50).optional(),
    phone: optionalCapped(20),
    college: optionalCapped(120),
    branch: optionalCapped(80),
    yearOfStudy: optionalCapped(40),
    targetExam: optionalCapped(60),
});

const changePasswordSchema = z.object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
        .string()
        .min(6, "New password must be at least 6 characters")
        .max(72, "Password too long"),
});

module.exports = {
    registerSchema,
    loginSchema,
    forgotPasswordSchema,
    resetPasswordSchema,
    updateProfileSchema,
    changePasswordSchema,
    verifyOtpSchema,
    resendOtpSchema,
};
