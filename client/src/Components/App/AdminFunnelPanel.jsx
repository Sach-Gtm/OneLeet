import { useEffect, useState, useCallback } from "react";
import { Filter, Loader2, ChevronDown } from "lucide-react";
import { getFunnel } from "@/Api/AdminApi";

// Acquisition-funnel panel (audit C3): distinct people reaching each step over a
// window, with drop-off vs the top and vs the previous step, so the founder can
// see where students fall out (e.g. how many land but never register).
const LABELS = {
    land: "Landed",
    register_start: "Started register",
    register_done: "Registered",
    onboarding_done: "Picked a batch",
    first_test_start: "Started a test",
    first_test_done: "Finished a test",
    results_viewed: "Saw results",
    paywall_viewed: "Hit the paywall",
    checkout_start: "Reached checkout",
    payment_done: "Paid",
};
const RANGES = [7, 30, 90];

export default function AdminFunnelPanel() {
    const [open, setOpen] = useState(false);
    const [days, setDays] = useState(7);
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState(null);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            setData(await getFunnel(days));
        } catch {
            setData(null);
        } finally {
            setLoading(false);
        }
    }, [days]);

    useEffect(() => {
        load();
    }, [load]);

    const steps = data?.steps || [];
    const base = data?.base || 0;

    return (
        <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
            <button onClick={() => setOpen((o) => !o)} className="flex w-full items-center gap-3 px-5 py-4 text-left">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10">
                    <Filter size={18} />
                </span>
                <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-100">Acquisition funnel</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                        {base > 0
                            ? `${base} landed in ${days}d · ${steps.find((s) => s.name === "payment_done")?.count || 0} paid`
                            : "Where students drop off, land → pay"}
                    </p>
                </div>
                <ChevronDown size={18} className={`shrink-0 text-slate-400 transition ${open ? "rotate-180" : ""}`} />
            </button>

            {open && (
                <div className="border-t border-slate-100 px-5 py-4 dark:border-slate-800">
                    <div className="mb-3 flex items-center gap-2">
                        {RANGES.map((d) => (
                            <button
                                key={d}
                                onClick={() => setDays(d)}
                                className={`rounded-lg px-3 py-1 text-xs font-semibold transition ${
                                    days === d
                                        ? "bg-indigo-600 text-white"
                                        : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                                }`}
                            >
                                {d}d
                            </button>
                        ))}
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
                        </div>
                    ) : base === 0 ? (
                        <p className="py-8 text-center text-sm text-slate-400">
                            No funnel data yet. Events start flowing once students browse the live site.
                        </p>
                    ) : (
                        <div className="space-y-1.5">
                            {steps.map((s) => (
                                <div key={s.name} className="flex items-center gap-3">
                                    <span className="w-32 shrink-0 text-xs font-medium text-slate-600 dark:text-slate-300">
                                        {LABELS[s.name] || s.name}
                                    </span>
                                    <div className="relative h-6 flex-1 overflow-hidden rounded bg-slate-100 dark:bg-slate-800">
                                        <div
                                            className="h-full rounded bg-gradient-to-r from-indigo-500 to-violet-500"
                                            style={{ width: `${Math.max(s.pctOfTop, base ? 1.5 : 0)}%` }}
                                        />
                                        <span className="absolute inset-y-0 left-2 flex items-center text-[11px] font-semibold text-slate-700 dark:text-slate-200">
                                            {s.count}
                                        </span>
                                    </div>
                                    <span className="w-14 shrink-0 text-right text-xs tabular-nums text-slate-500">
                                        {s.pctOfTop}%
                                    </span>
                                    <span
                                        className={`w-14 shrink-0 text-right text-[11px] tabular-nums ${
                                            s.pctOfPrev < 50 ? "text-rose-500" : "text-slate-400"
                                        }`}
                                        title="Kept from the previous step"
                                    >
                                        {s.pctOfPrev}%
                                    </span>
                                </div>
                            ))}
                            <p className="pt-2 text-[11px] text-slate-400">
                                First % = share of everyone who landed · second % = kept from the step above
                                (red under 50%).
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
