import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
    Eye,
    EyeOff,
    ArrowRight,
    Loader2,
    GraduationCap,
    Presentation,
} from "lucide-react";
import toast from "react-hot-toast";

import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import { cn } from "@/lib/utils";
import AuthLayout from "@/Components/Auth/AuthLayout";
import { registerSchema } from "@/lib/validations/auth";
import { registerUser } from "@/Api/AuthApis";
import { useAuth } from "@/context/AuthContext";

const roles = [
    { value: "student", label: "Student", icon: GraduationCap },
    { value: "teacher", label: "Teacher", icon: Presentation },
];

export default function Register() {
    const navigate = useNavigate();
    const { refresh } = useAuth();
    const [showPassword, setShowPassword] = useState(false);

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors, isSubmitting },
    } = useForm({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            name: "",
            email: "",
            phone: "",
            role: "student",
            password: "",
            confirmPassword: "",
        },
    });

    const role = watch("role");

    const onSubmit = async (values) => {
        try {
            const { confirmPassword, ...payload } = values;
            void confirmPassword;
            await registerUser(payload);
            await refresh();
            toast.success("Account created — welcome to OneLeet!");
            navigate("/dashboard", { replace: true });
        } catch (err) {
            toast.error(err.message || "Registration failed");
        }
    };

    return (
        <AuthLayout
            heading="Begin your journey to India's top engineering colleges."
            subheading="Join thousands of students mastering their potential with OneLeet. Your future starts with a single click."
            stats={[{ value: "10k+", label: "Students" }]}
        >
            <div className="space-y-6">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Get Started</h2>
                    <p className="mt-1 text-sm text-slate-500">
                        Create your account to access premium resources.
                    </p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
                    {/* Role toggle */}
                    <div className="grid grid-cols-2 gap-3">
                        {roles.map((option) => {
                            const Icon = option.icon;
                            return (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() =>
                                        setValue("role", option.value, {
                                            shouldValidate: true,
                                        })
                                    }
                                    className={cn(
                                        "flex items-center justify-center gap-2 rounded-lg border py-2.5 text-sm font-semibold transition-all",
                                        role === option.value
                                            ? "border-blue-600 bg-blue-50 text-blue-700 ring-1 ring-blue-600"
                                            : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                                    )}
                                >
                                    <Icon size={16} /> {option.label}
                                </button>
                            );
                        })}
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="name">Full Name</Label>
                        <Input
                            id="name"
                            autoComplete="name"
                            placeholder="e.g. Rahul Sharma"
                            {...register("name")}
                        />
                        {errors.name && (
                            <p className="text-xs text-red-500">{errors.name.message}</p>
                        )}
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-1.5">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                autoComplete="email"
                                placeholder="hello@example.com"
                                {...register("email")}
                            />
                            {errors.email && (
                                <p className="text-xs text-red-500">{errors.email.message}</p>
                            )}
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="phone">Phone (optional)</Label>
                            <Input
                                id="phone"
                                type="tel"
                                autoComplete="tel"
                                placeholder="+91 98765 43210"
                                {...register("phone")}
                            />
                            {errors.phone && (
                                <p className="text-xs text-red-500">{errors.phone.message}</p>
                            )}
                        </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-1.5">
                            <Label htmlFor="password">Password</Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    autoComplete="new-password"
                                    placeholder="••••••••"
                                    className="pr-10"
                                    {...register("password")}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((v) => !v)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                            {errors.password && (
                                <p className="text-xs text-red-500">
                                    {errors.password.message}
                                </p>
                            )}
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="confirmPassword">Confirm Password</Label>
                            <Input
                                id="confirmPassword"
                                type={showPassword ? "text" : "password"}
                                autoComplete="new-password"
                                placeholder="••••••••"
                                {...register("confirmPassword")}
                            />
                            {errors.confirmPassword && (
                                <p className="text-xs text-red-500">
                                    {errors.confirmPassword.message}
                                </p>
                            )}
                        </div>
                    </div>

                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                        {isSubmitting ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" /> Creating account...
                            </>
                        ) : (
                            <>
                                Create Account <ArrowRight className="h-4 w-4" />
                            </>
                        )}
                    </Button>
                </form>

                <p className="text-center text-sm text-slate-500">
                    Already have an account?{" "}
                    <Link to="/login" className="font-semibold text-blue-600 hover:underline">
                        Login
                    </Link>
                </p>
            </div>
        </AuthLayout>
    );
}
