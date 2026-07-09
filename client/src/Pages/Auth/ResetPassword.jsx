import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import AuthLayout from "@/Components/Auth/AuthLayout";
import { resetPasswordSchema } from "@/lib/validations/auth";
import { resetPassword } from "@/Api/AuthApis";

export default function ResetPassword() {
    const { token } = useParams();
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm({
        resolver: zodResolver(resetPasswordSchema),
        defaultValues: { password: "", confirmPassword: "" },
    });

    const onSubmit = async (values) => {
        try {
            await resetPassword(token, { password: values.password });
            toast.success("Password reset — please log in.");
            navigate("/login", { replace: true });
        } catch (err) {
            toast.error(err.message || "Reset link is invalid or has expired");
        }
    };

    return (
        <AuthLayout
            heading="Set a new password and get back to cracking your LEET prep."
            subheading="Choose a strong password you don't use anywhere else."
        >
            <div className="space-y-6">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">New password</h2>
                    <p className="mt-1 text-sm text-slate-500">
                        Enter and confirm your new password below.
                    </p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
                    <div className="space-y-1.5">
                        <Label htmlFor="password">New Password</Label>
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
                            <p className="text-xs text-red-500">{errors.password.message}</p>
                        )}
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="confirmPassword">Confirm New Password</Label>
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

                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                        {isSubmitting ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" /> Resetting...
                            </>
                        ) : (
                            "Reset password"
                        )}
                    </Button>
                </form>

                <p className="text-center text-sm text-slate-500">
                    Remembered it?{" "}
                    <Link to="/login" className="font-semibold text-blue-600 hover:underline">
                        Back to login
                    </Link>
                </p>
            </div>
        </AuthLayout>
    );
}
