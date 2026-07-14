import { z } from "zod";

export const registerSchema = z
    .object({
        name: z.string().trim().min(2, "Enter your full name").max(50),
        email: z.string().trim().email("Enter a valid email address"),
        phone: z
            .string()
            .trim()
            .min(10, "Enter a valid phone number")
            .max(20, "Phone number too long")
            .regex(/^\+?[0-9][0-9\s-]{8,}$/, "Enter a valid phone number"),
        password: z.string().min(6, "Password must be at least 6 characters"),
        confirmPassword: z.string(),
    })
    .refine((d) => d.password === d.confirmPassword, {
        message: "Passwords do not match",
        path: ["confirmPassword"],
    });

export const loginSchema = z.object({
    identifier: z.string().trim().min(1, "Enter your email or phone number"),
    password: z.string().min(1, "Enter your password"),
});

export const forgotPasswordSchema = z.object({
    email: z.string().trim().email("Enter a valid email address"),
});

export const resetPasswordSchema = z
    .object({
        password: z.string().min(6, "Password must be at least 6 characters"),
        confirmPassword: z.string(),
    })
    .refine((d) => d.password === d.confirmPassword, {
        message: "Passwords do not match",
        path: ["confirmPassword"],
    });
