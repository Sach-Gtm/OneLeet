import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { Loader2, Gift, Copy, Check, Share2, Trophy, Users, CalendarClock } from "lucide-react";
import { getMyReferral } from "@/Api/PaymentsApi";
import { whatsappLink } from "@/config/support";
import TopoLines from "@/Components/General/TopoLines";

export default function Refer() {
    const [ref, setRef] = useState(null);
    const [copied, setCopied] = useState(false);

    useEffect(() => { getMyReferral().then(setRef).catch(() => setRef(false)); }, []);

    if (ref === null) return <div className="flex h-48 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-indigo-600" /></div>;
    if (ref === false) return <p className="text-sm text-slate-500">Couldn&apos;t load your referral code. Please try again.</p>;

    // Share the LINK (not just the code): signing up through it attributes the
    // friend to you automatically — no code to type at checkout.
    const origin = typeof window !== "undefined" ? window.location.origin : "https://oneleet.in";
    const link = `${origin}/register?ref=${ref.code}`;
    const shareText = `Prepping for LEET? Join me on OneLeet — AI mentor, real PYQs, ranked mocks and a Success Promise. Sign up with my link: ${link} 🚀`;

    const copy = () => {
        navigator.clipboard?.writeText(link).then(() => {
            setCopied(true);
            toast.success("Referral link copied!");
            setTimeout(() => setCopied(false), 1800);
        });
    };

    const pct = Math.min(100, Math.round((ref.conversionCount / ref.threshold) * 100));
    const bookMsg = `Hi OneLeet! I've referred ${ref.threshold} friends and unlocked my reward — I'd like to book my 1:1 session with the founders.`;

    return (
        <div className="mx-auto max-w-xl">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-800 p-6 text-white">
                <TopoLines color="rgb(255 255 255)" opacity={0.1} />
                <div className="relative z-10">
                <Gift className="h-8 w-8" />
                <h1 className="mt-3 text-2xl font-bold">Refer friends, earn a founder 1:1</h1>
                <p className="mt-1 max-w-md text-sm text-indigo-100">
                    Share your link. When {ref.threshold} friends sign up through it, you unlock a{" "}
                    <strong>1:1 strategy session with the founders</strong>.
                </p>

                <div className="mt-5 rounded-xl bg-white/10 p-2 backdrop-blur-sm">
                    <div className="flex items-center gap-2">
                        <code className="min-w-0 flex-1 truncate px-3 text-sm font-bold tracking-wide">{link}</code>
                        <button onClick={copy} className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-sm font-bold text-indigo-700 hover:bg-indigo-50">
                            {copied ? <Check size={15} /> : <Copy size={15} />} {copied ? "Copied" : "Copy link"}
                        </button>
                    </div>
                    <p className="mt-1 px-3 text-[11px] text-indigo-200">Your code: <span className="font-bold tracking-wider">{ref.code}</span></p>
                </div>
                <a href={whatsappLink(shareText)} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-600">
                    <Share2 size={15} /> Share on WhatsApp
                </a>
                </div>
            </div>

            {/* Progress */}
            <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
                <div className="flex items-center justify-between">
                    <p className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-slate-100"><Users size={15} /> Friends signed up</p>
                    <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{ref.conversionCount} / {ref.threshold}</p>
                </div>
                <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-indigo-700"
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.9, ease: "easeOut", delay: 0.2 }}
                    />
                </div>
                {ref.rewardUnlocked ? (
                    <div className="mt-3 space-y-3">
                        <div className="flex items-center gap-2 rounded-lg bg-emerald-50 p-3 text-sm font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                            <Trophy size={16} /> Reward unlocked — you referred {ref.threshold} friends!
                        </div>
                        {ref.rewardFulfilled ? (
                            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                Your 1:1 session is arranged — check your WhatsApp for the details.
                            </p>
                        ) : (
                            <a
                                href={whatsappLink(bookMsg)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white transition hover:scale-[1.02] hover:bg-indigo-700"
                            >
                                <CalendarClock size={16} /> Book your 1:1 session with the founders
                            </a>
                        )}
                    </div>
                ) : (
                    <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                        {ref.remaining} more {ref.remaining === 1 ? "friend" : "friends"} to sign up with your link and you unlock a 1:1 session with the founders.
                    </p>
                )}
            </div>
        </div>
    );
}
