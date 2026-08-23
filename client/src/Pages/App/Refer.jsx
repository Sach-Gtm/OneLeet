import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Loader2, Gift, Copy, Check, Share2, Users, IndianRupee, Clock, Wallet } from "lucide-react";
import { getMyReferral } from "@/Api/PaymentsApi";
import { whatsappLink } from "@/config/support";
import TopoLines from "@/Components/General/TopoLines";

const rupee = (n) => "₹" + Number(n || 0).toLocaleString("en-IN");
const fmtDate = (iso) => (iso ? new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "-");

export default function Refer() {
    const [ref, setRef] = useState(null);
    const [copied, setCopied] = useState(false);

    useEffect(() => { getMyReferral().then(setRef).catch(() => setRef(false)); }, []);

    if (ref === null) return <div className="flex h-48 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-indigo-600" /></div>;
    if (ref === false) return <p className="text-sm text-slate-500">Couldn&apos;t load your referral code. Please try again.</p>;

    const pct = ref.rewardPct || 7;
    // Share the LINK: signing up through it tags the friend to you; they then apply
    // your code at checkout to earn you the cash reward.
    const origin = typeof window !== "undefined" ? window.location.origin : "https://oneleet.in";
    const link = `${origin}/register?ref=${ref.code}`;
    const shareText = `Prepping for LEET? Join me on OneLeet, AI mentor, real PYQs, ranked mocks and a Success Promise. Use my referral code ${ref.code} at checkout: ${link} 🚀`;

    const copy = () => {
        if (!navigator.clipboard?.writeText) return toast("Long-press the link above to copy it.");
        navigator.clipboard.writeText(link)
            .then(() => { setCopied(true); toast.success("Referral link copied!"); setTimeout(() => setCopied(false), 1800); })
            .catch(() => toast.error("Couldn't copy, long-press the link to copy it."));
    };

    const stats = [
        { label: "Total earned", value: rupee(ref.totalEarned), icon: IndianRupee, tint: "text-indigo-600" },
        { label: "Paid to you", value: rupee(ref.paidOut), icon: Check, tint: "text-emerald-600" },
        { label: "Pending", value: rupee(ref.pending), icon: Clock, tint: "text-amber-600" },
    ];

    return (
        <div className="mx-auto max-w-xl">
            {/* Offer hero */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-800 p-6 text-white">
                <TopoLines color="rgb(255 255 255)" opacity={0.1} />
                <div className="relative z-10">
                    <Gift className="h-8 w-8" />
                    <h1 className="mt-3 text-2xl font-bold">Refer friends, earn {pct}% cash</h1>
                    <p className="mt-1 max-w-md text-sm text-indigo-100">
                        When a friend enrolls in any paid course and applies your code at checkout, you earn{" "}
                        <strong>{pct}% of what they pay</strong>, credited to you about <strong>1.25 months</strong> after their payment.
                    </p>

                    <div className="mt-5 rounded-xl bg-white/10 p-2 backdrop-blur-sm">
                        <div className="flex items-center gap-2">
                            <code className="min-w-0 flex-1 truncate px-3 text-sm font-bold tracking-wide">{link}</code>
                            <button onClick={copy} className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-sm font-bold text-indigo-700 hover:bg-indigo-50">
                                {copied ? <Check size={15} /> : <Copy size={15} />} {copied ? "Copied" : "Copy link"}
                            </button>
                        </div>
                        <p className="mt-1 px-3 text-[11px] text-indigo-200">Your referral code: <span className="font-bold tracking-wider">{ref.code}</span></p>
                    </div>
                    <a href={whatsappLink(shareText)} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-600">
                        <Share2 size={15} /> Share on WhatsApp
                    </a>
                </div>
            </div>

            {/* Earnings */}
            <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
                <div className="flex items-center justify-between">
                    <p className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-slate-100"><Wallet size={15} /> Your referral earnings</p>
                    <p className="flex items-center gap-1 text-xs font-semibold text-slate-500 dark:text-slate-400"><Users size={13} /> {ref.referredPaidCount || 0} friend{ref.referredPaidCount === 1 ? "" : "s"} enrolled</p>
                </div>

                <div className="mt-3 grid grid-cols-3 gap-2">
                    {stats.map((s) => {
                        const Icon = s.icon;
                        return (
                            <div key={s.label} className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/40">
                                <div className={`flex items-center gap-1 text-[11px] font-semibold ${s.tint}`}><Icon className="h-3.5 w-3.5" /> {s.label}</div>
                                <div className="mt-1 text-lg font-extrabold tabular-nums text-slate-900 dark:text-slate-100">{s.value}</div>
                            </div>
                        );
                    })}
                </div>

                {ref.pending > 0 && ref.nextPayoutAt && (
                    <p className="mt-3 flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
                        <Clock size={14} /> Your next payout of pending earnings is due around <b className="font-bold">{fmtDate(ref.nextPayoutAt)}</b>. The OneLeet team credits it to you then.
                    </p>
                )}
                {ref.referredPaidCount === 0 && (
                    <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                        Share your code. As soon as a friend enrolls in a paid course with it, {pct}% of what they pay shows up here.
                    </p>
                )}
            </div>

            {/* How it works */}
            <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100">How the {pct}% reward works</p>
                <ol className="mt-3 space-y-2.5">
                    {[
                        ["Share your code or link", "Send your referral link (or just the code) to friends preparing for LEET."],
                        [`They enroll with your code`, "Your friend joins a paid course and applies your code at checkout."],
                        [`You earn ${pct}% cash`, `You get ${pct}% of what they paid, credited about 1.25 months after their payment.`],
                    ].map(([h, b], i) => (
                        <li key={h} className="flex gap-3">
                            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300">{i + 1}</span>
                            <div>
                                <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">{h}</div>
                                <div className="text-xs text-slate-500 dark:text-slate-400">{b}</div>
                            </div>
                        </li>
                    ))}
                </ol>
                <p className="mt-3 border-t border-slate-100 pt-3 text-[11px] leading-relaxed text-slate-400 dark:border-slate-800">
                    Reward is {pct}% of the course value your friend actually pays, per referred student, on their first paid enrollment with your code. Payouts mature ~1.25 months after payment and are sent by the OneLeet team. You can&apos;t use your own code.
                </p>
            </div>
        </div>
    );
}
