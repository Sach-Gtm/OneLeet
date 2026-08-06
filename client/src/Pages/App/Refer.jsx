import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Loader2, Gift, Copy, Check, Share2, Trophy, Users } from "lucide-react";
import { getMyReferral } from "@/Api/PaymentsApi";
import { whatsappLink } from "@/config/support";

export default function Refer() {
    const [ref, setRef] = useState(null);
    const [copied, setCopied] = useState(false);

    useEffect(() => { getMyReferral().then(setRef).catch(() => setRef(false)); }, []);

    if (ref === null) return <div className="flex h-48 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-indigo-600" /></div>;
    if (ref === false) return <p className="text-sm text-slate-500">Couldn&apos;t load your referral code. Please try again.</p>;

    const shareText = `Prepping for LEET? Join me on OneLeet — AI mentor, real PYQs, ranked mocks and a Success Promise. Use my code ${ref.code} at oneleet.in 🚀`;
    const copy = () => {
        navigator.clipboard?.writeText(ref.code).then(() => {
            setCopied(true);
            toast.success("Code copied!");
            setTimeout(() => setCopied(false), 1800);
        });
    };

    const pct = Math.min(100, Math.round((ref.conversionCount / ref.threshold) * 100));

    return (
        <div className="mx-auto max-w-xl">
            <div className="rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-800 p-6 text-white">
                <Gift className="h-8 w-8" />
                <h1 className="mt-3 text-2xl font-bold">Refer friends, earn rewards</h1>
                <p className="mt-1 max-w-md text-sm text-indigo-100">
                    When {ref.threshold} friends go premium with your code, you unlock exclusive OneLeet merch <strong>and</strong> a
                    1:1 session with the founder.
                </p>

                <div className="mt-5 flex items-center gap-2 rounded-xl bg-white/10 p-2 backdrop-blur-sm">
                    <code className="flex-1 px-3 text-xl font-extrabold tracking-wider">{ref.code}</code>
                    <button onClick={copy} className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-sm font-bold text-indigo-700 hover:bg-indigo-50">
                        {copied ? <Check size={15} /> : <Copy size={15} />} {copied ? "Copied" : "Copy"}
                    </button>
                </div>
                <a href={whatsappLink(shareText)} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-600">
                    <Share2 size={15} /> Share on WhatsApp
                </a>
            </div>

            {/* Progress */}
            <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
                <div className="flex items-center justify-between">
                    <p className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-slate-100"><Users size={15} /> Your conversions</p>
                    <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{ref.conversionCount} / {ref.threshold}</p>
                </div>
                <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div className="h-full rounded-full bg-indigo-600 transition-all" style={{ width: `${pct}%` }} />
                </div>
                {ref.rewardUnlocked ? (
                    <div className="mt-3 flex items-center gap-2 rounded-lg bg-emerald-50 p-3 text-sm font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                        <Trophy size={16} /> Reward unlocked! {ref.rewardFulfilled ? "Your merch + 1:1 are on the way." : "Our team will reach out to arrange your merch + founder 1:1."}
                    </div>
                ) : (
                    <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                        {ref.remaining} more premium {ref.remaining === 1 ? "conversion" : "conversions"} to unlock your reward. A conversion counts once a friend upgrades to premium using your code.
                    </p>
                )}
            </div>
        </div>
    );
}
