import { useEffect, useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { Loader2, ArrowRight, MailCheck } from "lucide-react";

import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import AuthLayout from "@/Components/Auth/AuthLayout";
import { verifyOtp, resendOtp } from "@/Api/AuthApis";
import { useAuth } from "@/context/AuthContext";

export default function VerifyOtp() {
    const navigate = useNavigate();
    const location = useLocation();
    const { refresh } = useAuth();
    const email = location.state?.email || "";

    const [otp, setOtp] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [cooldown, setCooldown] = useState(0);

    // No email in navigation state means the user landed here directly — send
    // them back to register where the flow starts.
    useEffect(() => {
        if (!email) navigate("/register", { replace: true });
    }, [email, navigate]);

    useEffect(() => {
        if (cooldown <= 0) return;
        const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
        return () => clearTimeout(t);
    }, [cooldown]);

    const handleVerify = async (e) => {
        e.preventDefault();
        if (otp.length !== 6) {
            toast.error("Enter the 6-digit code");
            return;
        }
        setSubmitting(true);
        try {
            await verifyOtp({ email, otp });
            await refresh();
            toast.success("Email verified — welcome to OneLeet!");
            navigate("/dashboard", { replace: true });
        } catch (err) {
            toast.error(err.message || "Verification failed");
        } finally {
            setSubmitting(false);
        }
    };

    const handleResend = async () => {
        if (cooldown > 0) return;
        try {
            await resendOtp({ email });
            toast.success("A new code has been sent to your email");
            setCooldown(60);
        } catch (err) {
            toast.error(err.message || "Could not resend the code");
            if (err.status === 429) setCooldown(60);
        }
    };

    return (
        <AuthLayout
            heading="Just one more step to secure your account."
            subheading="We've emailed you a 6-digit verification code. Enter it below to activate your OneLeet account."
            stats={[{ value: "100%", label: "Verified accounts" }]}
        >
            <div className="space-y-6">
                <div className="flex flex-col items-center text-center">
                    <span className="mb-3 grid h-12 w-12 place-items-center rounded-full bg-blue-100 text-blue-600">
                        <MailCheck className="h-6 w-6" />
                    </span>
                    <h2 className="text-2xl font-bold text-slate-900">
                        Verify your email
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                        Enter the 6-digit code sent to{" "}
                        <span className="font-semibold text-slate-700">
                            {email}
                        </span>
                    </p>
                </div>

                <form onSubmit={handleVerify} className="space-y-4" noValidate>
                    <div className="space-y-1.5">
                        <Label htmlFor="otp">Verification code</Label>
                        <Input
                            id="otp"
                            inputMode="numeric"
                            autoComplete="one-time-code"
                            maxLength={6}
                            placeholder="123456"
                            className="text-center text-lg tracking-[0.5em]"
                            value={otp}
                            onChange={(e) =>
                                setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                            }
                        />
                    </div>

                    <Button
                        type="submit"
                        className="w-full"
                        disabled={submitting || otp.length !== 6}
                    >
                        {submitting ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" /> Verifying...
                            </>
                        ) : (
                            <>
                                Verify <ArrowRight className="h-4 w-4" />
                            </>
                        )}
                    </Button>
                </form>

                <div className="text-center text-sm text-slate-500">
                    Didn&apos;t get the code?{" "}
                    <button
                        type="button"
                        onClick={handleResend}
                        disabled={cooldown > 0}
                        className="font-semibold text-blue-600 hover:underline disabled:cursor-not-allowed disabled:text-slate-400 disabled:no-underline"
                    >
                        {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
                    </button>
                </div>

                <p className="text-center text-sm text-slate-500">
                    Wrong email?{" "}
                    <Link
                        to="/register"
                        className="font-semibold text-blue-600 hover:underline"
                    >
                        Go back
                    </Link>
                </p>
            </div>
        </AuthLayout>
    );
}
