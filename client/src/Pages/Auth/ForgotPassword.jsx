import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Loader2, MailCheck } from "lucide-react";
import toast from "react-hot-toast";

import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import AuthLayout from "@/Components/Auth/AuthLayout";
import { forgotPasswordSchema } from "@/lib/validations/auth";
import { forgotPassword } from "@/Api/AuthApis";

export default function ForgotPassword() {
    const [sent, setSent] = useState(false);
    const [devResetUrl, setDevResetUrl] = useState(null);

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm({
        resolver: zodResolver(forgotPasswordSchema),
        defaultValues: { email: "" },
    });

    const onSubmit = async (values) => {
        try {
            const res = await forgotPassword(values);
            setSent(true);
            // In development the API returns the reset link directly so the
            // flow is usable before an email provider is wired up.
            if (res?.resetUrl) setDevResetUrl(res.resetUrl);
        } catch (err) {
            toast.error(err.message || "Something went wrong");
        }
    };

    return (
        <AuthLayout
            heading="Forgot your password? It happens to the best of us."
            subheading="Enter the email tied to your OneLeet account and we'll send you a link to reset your password."
        >
            <div className="space-y-6">
                <Link
                    to="/login"
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-700"
                >
                    <ArrowLeft size={16} /> Back to login
                </Link>

                {sent ? (
                    <div className="space-y-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600">
                            <MailCheck size={24} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900">Check your email</h2>
                            <p className="mt-1 text-sm text-slate-500">
                                If an account exists for that email, we&apos;ve sent a password
                                reset link. It expires in 1 hour.
                            </p>
                        </div>
                        {devResetUrl && (
                            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                                <p className="mb-1 font-semibold">Dev mode — reset link:</p>
                                <Link
                                    to={devResetUrl.replace(/^https?:\/\/[^/]+/, "")}
                                    className="break-all font-medium text-blue-600 hover:underline"
                                >
                                    {devResetUrl}
                                </Link>
                            </div>
                        )}
                    </div>
                ) : (
                    <>
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900">
                                Reset your password
                            </h2>
                            <p className="mt-1 text-sm text-slate-500">
                                We&apos;ll email you a secure reset link.
                            </p>
                        </div>

                        <form
                            onSubmit={handleSubmit(onSubmit)}
                            className="space-y-4"
                            noValidate
                        >
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

                            <Button type="submit" className="w-full" disabled={isSubmitting}>
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" /> Sending...
                                    </>
                                ) : (
                                    "Send reset link"
                                )}
                            </Button>
                        </form>
                    </>
                )}
            </div>
        </AuthLayout>
    );
}
