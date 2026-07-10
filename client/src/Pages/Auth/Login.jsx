import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, ArrowRight, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import AuthLayout from "@/Components/Auth/AuthLayout";
import GoogleLogin from "@/Components/Auth/GoogleLogin";
import { loginSchema } from "@/lib/validations/auth";
import { loginUser } from "@/Api/AuthApis";
import { useAuth } from "@/context/AuthContext";
import { GOOGLE_ENABLED } from "@/lib/googleAuth";

export default function Login() {
    const navigate = useNavigate();
    const location = useLocation();
    const { refresh } = useAuth();
    const [showPassword, setShowPassword] = useState(false);

    const redirectTo = location.state?.from?.pathname || "/dashboard";

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm({
        resolver: zodResolver(loginSchema),
        defaultValues: { email: "", password: "" },
    });

    const onSubmit = async (values) => {
        try {
            await loginUser(values);
            await refresh();
            toast.success("Welcome back!");
            navigate(redirectTo, { replace: true });
        } catch (err) {
            // Account exists but email isn't verified yet → go finish OTP.
            if (err.needsVerification) {
                toast("Please verify your email to continue.");
                navigate("/verify-otp", {
                    state: { email: err.email || values.email },
                });
                return;
            }
            toast.error(err.message || "Login failed");
        }
    };

    return (
        <AuthLayout
            heading="Welcome back, future achiever."
            subheading="Every focused session brings your dream college closer. Pick up right where you left off."
            stats={[
                { value: "50k+", label: "Active Students" },
                { value: "100+", label: "Top Colleges" },
            ]}
        >
            <div className="space-y-6">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Welcome Back</h2>
                    <p className="mt-1 text-sm text-slate-500">
                        Please enter your details to sign in.
                    </p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
                    <div className="space-y-1.5">
                        <Label htmlFor="email">Email Address</Label>
                        <Input
                            id="email"
                            type="email"
                            autoComplete="email"
                            placeholder="student@example.com"
                            {...register("email")}
                        />
                        {errors.email && (
                            <p className="text-xs text-red-500">{errors.email.message}</p>
                        )}
                    </div>

                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="password">Password</Label>
                            <Link
                                to="/forgot-password"
                                className="text-xs font-semibold text-indigo-600 hover:underline"
                            >
                                Forgot Password?
                            </Link>
                        </div>
                        <div className="relative">
                            <Input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                autoComplete="current-password"
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
                            <p className="text-xs text-red-500">{errors.password.message}</p>
                        )}
                    </div>

                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                        {isSubmitting ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" /> Signing in...
                            </>
                        ) : (
                            <>
                                Login <ArrowRight className="h-4 w-4" />
                            </>
                        )}
                    </Button>
                </form>

                {GOOGLE_ENABLED && (
                    <>
                        <div className="flex items-center gap-3">
                            <div className="h-px flex-1 bg-slate-200" />
                            <span className="text-xs text-slate-400">
                                Or continue with
                            </span>
                            <div className="h-px flex-1 bg-slate-200" />
                        </div>

                        <GoogleLogin redirectTo={redirectTo} />
                    </>
                )}

                <p className="text-center text-sm text-slate-500">
                    Don&apos;t have an account?{" "}
                    <Link
                        to="/register"
                        className="font-semibold text-indigo-600 hover:underline"
                    >
                        Register for free
                    </Link>
                </p>
            </div>
        </AuthLayout>
    );
}
