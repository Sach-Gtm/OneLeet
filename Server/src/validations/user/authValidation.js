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
    phone: z.string().trim().max(20, "Phone number too long").optional().or(z.literal("")),
    avatar: z.string().url("Avatar must be a valid URL").optional().or(z.literal("")),
});

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

module.exports = {
    registerSchema,
    loginSchema,
    forgotPasswordSchema,
    resetPasswordSchema,
};
