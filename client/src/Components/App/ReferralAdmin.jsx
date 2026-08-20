import { useEffect, useState, useCallback, useMemo } from "react";
import { Gift, Loader2, RefreshCw, Download, Check, IndianRupee, Clock, Inbox } from "lucide-react";
import toast from "react-hot-toast";
import { getReferralPayouts, markReferralPaid } from "@/Api/AdminApi";

const rupee = (n) => "Rs. " + Number(n || 0).toLocaleString("en-IN");
const fmtDate = (iso) => (iso ? new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—");
const csvEsc = (v) => {
    const s = String(v ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

// Admin-only: the referral cash-payout ledger. Each referred purchase earns the
// referrer 7% of the course value, due ~1.25 months after the friend pays. Shows
// who to pay, how much, and when, and lets staff mark a payout done + export CSV.
export default function ReferralAdmin() {
    const [data, setData] = useState(null); // { summary, payouts }
    const [loading, setLoading] = useState(false);
    const [filter, setFilter] = useState("due"); // due | pending | paid | all
    const [busyKey, setBusyKey] = useState(null);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getReferralPayouts();
            setData(res || { summary: {}, payouts: [] });
        } catch (err) {
            toast.error(err.message || "Couldn't load referral payouts");
            setData({ summary: {}, payouts: [] });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const payouts = data?.payouts || [];
    const summary = data?.summary || {};
    const pct = summary.rewardPct || 7;

    const rows = useMemo(() => {
        const all = data?.payouts || [];
        if (filter === "all") return all;
        if (filter === "paid") return all.filter((p) => p.status === "paid");
        if (filter === "due") return all.filter((p) => p.status !== "paid" && p.dueNow);
        return all.filter((p) => p.status !== "paid"); // pending
    }, [data, filter]);

    const markPaid = async (p, undo = false) => {
        if (!undo) {
            const note = window.prompt("Payment reference (UPI / bank transaction id) — optional:", "");
            if (note === null) return; // cancelled
            setBusyKey(p.orderId);
            try {
                await markReferralPaid({ referralId: p.referralId, orderId: p.orderId, note });
                toast.success(`Marked ${rupee(p.reward)} paid to ${p.referrer?.name || "referrer"}`);
                load();
            } catch (err) {
                toast.error(err.message || "Couldn't update");
            } finally {
                setBusyKey(null);
            }
        } else {
            setBusyKey(p.orderId);
            try {
                await markReferralPaid({ referralId: p.referralId, orderId: p.orderId, undo: true });
                load();
            } catch (err) {
                toast.error(err.message || "Couldn't update");
            } finally {
                setBusyKey(null);
            }
        }
    };

    const downloadCsv = () => {
        const header = ["Referrer", "Referrer email", "Referrer phone", "Code", "Referred student", "Referred email", "Course value", `Reward (${pct}%)`, "Friend paid on", "Payout due", "Status", "Paid on", "Note"];
        const lines = payouts.map((p) => [
            p.referrer?.name, p.referrer?.email, p.referrer?.phone, p.code,
            p.referred?.name, p.referred?.email, p.courseValue, p.reward,
            p.referredPaidOn ? new Date(p.referredPaidOn).toISOString().slice(0, 10) : "",
            p.payoutDueAt ? new Date(p.payoutDueAt).toISOString().slice(0, 10) : "",
            p.status, p.paidAt ? new Date(p.paidAt).toISOString().slice(0, 10) : "", p.note,
        ].map(csvEsc).join(","));
        const csv = [header.join(","), ...lines].join("\n");
        const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
        const a = document.createElement("a");
        a.href = url; a.download = "oneleet-referral-payouts.csv";
        document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    };

    const TABS = [
        { key: "due", label: "Due now", count: summary.dueNowCount },
        { key: "pending", label: "All pending" },
        { key: "paid", label: "Paid" },
        { key: "all", label: "All" },
    ];

    return (
        <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                    <Gift className="h-4 w-4 text-indigo-600" /> Referral payouts
                    <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-bold text-indigo-700">{pct}% cash</span>
                </div>
                <div className="flex items-center gap-2">
                    <button type="button" onClick={load} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50">
                        <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
                    </button>
                    <button type="button" onClick={downloadCsv} disabled={!payouts.length} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">
                        <Download className="h-3.5 w-3.5" /> Download CSV
                    </button>
                </div>
            </div>

            {/* Summary */}
            <div className="mb-3 grid grid-cols-3 gap-2">
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                    <div className="flex items-center gap-1 text-[11px] font-semibold text-amber-700"><Clock className="h-3.5 w-3.5" /> Due to pay now</div>
                    <div className="mt-1 text-lg font-extrabold text-amber-800">{rupee(summary.totalDueNow)}</div>
                    <div className="text-[10px] text-amber-600">{summary.dueNowCount || 0} payout{summary.dueNowCount === 1 ? "" : "s"} matured</div>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-600"><IndianRupee className="h-3.5 w-3.5" /> Total pending</div>
                    <div className="mt-1 text-lg font-extrabold text-slate-800">{rupee(summary.totalPending)}</div>
                    <div className="text-[10px] text-slate-500">owed, incl. not-yet-matured</div>
                </div>
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                    <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700"><Check className="h-3.5 w-3.5" /> Paid out</div>
                    <div className="mt-1 text-lg font-extrabold text-emerald-800">{rupee(summary.totalPaid)}</div>
                    <div className="text-[10px] text-emerald-600">all-time</div>
                </div>
            </div>

            <p className="mb-3 text-xs text-slate-500">
                A referrer earns <b>{pct}% of the course value</b> when a friend pays with their code, due <b>~1.25 months</b> ({summary.payoutDelayDays || 38} days) after the friend&apos;s payment. Pay them via UPI/bank and mark it done here.
            </p>

            {/* Filter tabs */}
            <div className="mb-3 flex flex-wrap gap-2">
                {TABS.map((t) => (
                    <button key={t.key} type="button" onClick={() => setFilter(t.key)}
                        className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${filter === t.key ? "border-indigo-600 bg-indigo-50 text-indigo-700" : "border-slate-200 text-slate-500 hover:bg-slate-50"}`}>
                        {t.label}{t.count ? ` · ${t.count}` : ""}
                    </button>
                ))}
            </div>

            {data === null ? (
                <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-indigo-600" /></div>
            ) : rows.length === 0 ? (
                <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-slate-200 py-10 text-center text-sm text-slate-400">
                    <Inbox className="h-6 w-6" />
                    {filter === "due" ? "No payouts are due right now." : filter === "paid" ? "No payouts marked paid yet." : "No referral payouts yet."}
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                            <tr>
                                <th className="px-3 py-2.5">Referrer (pay them)</th>
                                <th className="px-3 py-2.5">Referred student</th>
                                <th className="px-3 py-2.5 text-right">Course value</th>
                                <th className="px-3 py-2.5 text-right">Reward {pct}%</th>
                                <th className="px-3 py-2.5 whitespace-nowrap">Payout due</th>
                                <th className="px-3 py-2.5 text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {rows.map((p) => (
                                <tr key={`${p.referralId}-${p.orderId}`} className="hover:bg-slate-50">
                                    <td className="px-3 py-2.5">
                                        <div className="font-semibold text-slate-800">{p.referrer?.name || "—"}</div>
                                        <div className="text-xs text-slate-500">
                                            {p.referrer?.email && <a href={`mailto:${p.referrer.email}`} className="hover:text-indigo-600">{p.referrer.email}</a>}
                                            {p.referrer?.phone && <> · <a href={`tel:${p.referrer.phone}`} className="hover:text-indigo-600">{p.referrer.phone}</a></>}
                                        </div>
                                        <div className="mt-0.5 inline-block rounded bg-slate-100 px-1.5 text-[10px] font-bold tracking-wider text-slate-600">{p.code}</div>
                                    </td>
                                    <td className="px-3 py-2.5 text-slate-600">
                                        <div>{p.referred?.name || "—"}</div>
                                        <div className="text-xs text-slate-400">{p.referred?.email || ""}</div>
                                        <div className="text-[10px] text-slate-400">paid {fmtDate(p.referredPaidOn)}</div>
                                    </td>
                                    <td className="px-3 py-2.5 text-right tabular-nums text-slate-600">{rupee(p.courseValue)}</td>
                                    <td className="px-3 py-2.5 text-right font-bold tabular-nums text-indigo-700">{rupee(p.reward)}</td>
                                    <td className="px-3 py-2.5 whitespace-nowrap">
                                        <div className={p.dueNow && p.status !== "paid" ? "font-semibold text-amber-700" : "text-slate-600"}>{fmtDate(p.payoutDueAt)}</div>
                                        {p.status === "paid" ? (
                                            <span className="text-[10px] font-semibold text-emerald-600">paid {fmtDate(p.paidAt)}</span>
                                        ) : p.dueNow ? (
                                            <span className="text-[10px] font-semibold text-amber-600">due now</span>
                                        ) : (
                                            <span className="text-[10px] text-slate-400">upcoming</span>
                                        )}
                                    </td>
                                    <td className="px-3 py-2.5 text-center">
                                        {p.status === "paid" ? (
                                            <button type="button" onClick={() => markPaid(p, true)} disabled={busyKey === p.orderId}
                                                className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 disabled:opacity-50">
                                                {busyKey === p.orderId ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />} Paid
                                            </button>
                                        ) : (
                                            <button type="button" onClick={() => markPaid(p)} disabled={busyKey === p.orderId}
                                                className="inline-flex items-center gap-1 rounded-md bg-indigo-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50">
                                                {busyKey === p.orderId ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null} Mark paid
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
