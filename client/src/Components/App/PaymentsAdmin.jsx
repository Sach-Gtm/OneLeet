import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
    Loader2, IndianRupee, CheckCircle2, RotateCcw, Ticket, Plus, Trash2,
    Lock, Unlock, ChevronDown, ChevronUp,
} from "lucide-react";
import {
    adminListOrders, adminConfirmOrder, adminReopenOrder, adminSetPremium,
    adminListCoupons, adminCreateCoupon, adminDeleteCoupon,
} from "@/Api/AdminPaymentsApi";

const rupee = (n) => "₹" + Number(n || 0).toLocaleString("en-IN");
const inCls = "h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100";

const STATUS = {
    created: "bg-amber-100 text-amber-700",
    partially_paid: "bg-blue-100 text-blue-700",
    paid: "bg-emerald-100 text-emerald-700",
    locked: "bg-rose-100 text-rose-700",
    cancelled: "bg-slate-100 text-slate-600",
};

export default function PaymentsAdmin({ isSuper = false }) {
    const [open, setOpen] = useState(false);
    const [orders, setOrders] = useState(null);
    const [coupons, setCoupons] = useState(null);
    const [statusFilter, setStatusFilter] = useState("");
    const [busy, setBusy] = useState("");
    const [form, setForm] = useState({ code: "", type: "percent", value: "", maxDiscount: "", minCartValue: "", usageLimit: "", expiresAt: "" });

    const loadOrders = useCallback(() => {
        adminListOrders(statusFilter ? { status: statusFilter } : {}).then(setOrders).catch(() => setOrders([]));
    }, [statusFilter]);
    const loadCoupons = useCallback(() => {
        adminListCoupons().then(setCoupons).catch(() => setCoupons([]));
    }, []);

    useEffect(() => {
        if (open) { loadOrders(); loadCoupons(); }
    }, [open, loadOrders, loadCoupons]);

    async function confirm(o) {
        setBusy(o._id);
        try {
            await adminConfirmOrder(o._id);
            toast.success("Payment confirmed — premium granted");
            loadOrders();
        } catch (e) { toast.error(e.message); } finally { setBusy(""); }
    }
    async function reopen(o) {
        setBusy(o._id);
        try {
            await adminReopenOrder(o._id);
            toast.success("Order reopened — student can pay the 2nd installment");
            loadOrders();
        } catch (e) { toast.error(e.message); } finally { setBusy(""); }
    }
    async function togglePremium(userId, lock) {
        try {
            await adminSetPremium(userId, { premiumLocked: lock });
            toast.success(lock ? "Premium locked" : "Premium unlocked");
        } catch (e) { toast.error(e.message); }
    }

    async function createCoupon(e) {
        e.preventDefault();
        if (!form.code || form.value === "") return toast.error("Code and value are required");
        setBusy("new-coupon");
        try {
            await adminCreateCoupon({
                code: form.code,
                type: form.type,
                value: Number(form.value),
                maxDiscount: Number(form.maxDiscount) || 0,
                minCartValue: Number(form.minCartValue) || 0,
                usageLimit: Number(form.usageLimit) || 0,
                expiresAt: form.expiresAt || null,
            });
            toast.success(`Coupon ${form.code.toUpperCase()} created`);
            setForm({ code: "", type: "percent", value: "", maxDiscount: "", minCartValue: "", usageLimit: "", expiresAt: "" });
            loadCoupons();
        } catch (err) { toast.error(err.message); } finally { setBusy(""); }
    }
    async function removeCoupon(id) {
        try { await adminDeleteCoupon(id); loadCoupons(); toast.success("Coupon deleted"); }
        catch (e) { toast.error(e.message); }
    }

    return (
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
            <button onClick={() => setOpen((o) => !o)} className="flex w-full items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
                <IndianRupee className="h-4 w-4 text-emerald-600" /> Payments — orders &amp; coupons
                <span className="font-normal text-slate-400">— confirm payments, reopen split orders, manage coupons</span>
                {open ? <ChevronUp size={16} className="ml-auto" /> : <ChevronDown size={16} className="ml-auto" />}
            </button>

            {open && (
                <div className="mt-4 space-y-6">
                    {/* ── Orders ── */}
                    <div>
                        <div className="mb-2 flex items-center justify-between">
                            <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500">Orders</h3>
                            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100">
                                <option value="">All statuses</option>
                                <option value="created">Awaiting payment</option>
                                <option value="partially_paid">Partially paid</option>
                                <option value="paid">Paid</option>
                                <option value="locked">Locked</option>
                            </select>
                        </div>
                        {orders === null ? (
                            <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-indigo-600" /></div>
                        ) : orders.length === 0 ? (
                            <p className="py-4 text-center text-xs text-slate-400">No orders yet.</p>
                        ) : (
                            <div className="space-y-2">
                                {orders.map((o) => (
                                    <div key={o._id} className="rounded-lg border border-slate-200 p-3 text-xs dark:border-slate-700">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="font-semibold text-slate-800 dark:text-slate-100">{o.user?.name || "—"}</span>
                                            <span className="text-slate-400">{o.user?.email}</span>
                                            <span className={"rounded-full px-2 py-0.5 text-[10px] font-bold " + (STATUS[o.status] || "bg-slate-100")}>{o.status}</span>
                                            <span className="ml-auto font-bold text-slate-800 dark:text-slate-100">{rupee(o.amountPaid)} / {rupee(o.payable)}</span>
                                        </div>
                                        <p className="mt-1 text-slate-500 dark:text-slate-400">
                                            {o.items.map((i) => i.courseName).join(", ")} · {o.paymentPlan}
                                            {o.couponCode ? ` · ${o.couponCode}` : ""}{o.referralCode ? ` · ref ${o.referralCode}` : ""}
                                        </p>
                                        <div className="mt-2 flex flex-wrap gap-2">
                                            {(o.status === "created" || o.status === "partially_paid") && (
                                                <button onClick={() => confirm(o)} disabled={busy === o._id} className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-2.5 py-1.5 font-semibold text-white hover:bg-emerald-700 disabled:opacity-60">
                                                    {busy === o._id ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />} Confirm payment
                                                </button>
                                            )}
                                            {o.status === "locked" && (
                                                <button onClick={() => reopen(o)} disabled={busy === o._id} className="inline-flex items-center gap-1 rounded-md bg-indigo-600 px-2.5 py-1.5 font-semibold text-white hover:bg-indigo-700 disabled:opacity-60">
                                                    <RotateCcw size={12} /> Reopen
                                                </button>
                                            )}
                                            {isSuper && o.user?._id && (
                                                <>
                                                    <button onClick={() => togglePremium(o.user._id, true)} className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2.5 py-1.5 font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"><Lock size={12} /> Lock</button>
                                                    <button onClick={() => togglePremium(o.user._id, false)} className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2.5 py-1.5 font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"><Unlock size={12} /> Unlock</button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* ── Coupons ── */}
                    <div>
                        <h3 className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500"><Ticket size={13} /> Coupons</h3>
                        <form onSubmit={createCoupon} className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                            <input className={inCls} placeholder="CODE" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} />
                            <select className={inCls} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                                <option value="percent">% off</option>
                                <option value="flat">₹ off</option>
                            </select>
                            <input className={inCls} type="number" placeholder={form.type === "percent" ? "% value" : "₹ value"} value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} />
                            <input className={inCls} type="number" placeholder="Max ₹ off" value={form.maxDiscount} onChange={(e) => setForm({ ...form, maxDiscount: e.target.value })} title="Percent cap in rupees (optional)" />
                            <input className={inCls} type="number" placeholder="Min cart ₹" value={form.minCartValue} onChange={(e) => setForm({ ...form, minCartValue: e.target.value })} />
                            <input className={inCls} type="number" placeholder="Usage limit" value={form.usageLimit} onChange={(e) => setForm({ ...form, usageLimit: e.target.value })} />
                            <input className={inCls} type="date" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} title="Expiry (optional)" />
                            <button type="submit" disabled={busy === "new-coupon"} className="inline-flex items-center justify-center gap-1 rounded-lg bg-indigo-600 px-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60">
                                {busy === "new-coupon" ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Add
                            </button>
                        </form>

                        {coupons === null ? (
                            <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-indigo-600" /></div>
                        ) : coupons.length === 0 ? (
                            <p className="py-3 text-center text-xs text-slate-400">No coupons yet.</p>
                        ) : (
                            <div className="mt-3 space-y-1.5">
                                {coupons.map((c) => (
                                    <div key={c._id} className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs dark:border-slate-700">
                                        <span className="font-bold text-slate-800 dark:text-slate-100">{c.code}</span>
                                        <span className="text-slate-500">{c.type === "percent" ? `${c.value}%${c.maxDiscount ? ` (max ${rupee(c.maxDiscount)})` : ""}` : rupee(c.value)} off</span>
                                        {c.minCartValue ? <span className="text-slate-400">min {rupee(c.minCartValue)}</span> : null}
                                        {c.usageLimit ? <span className="text-slate-400">{c.usedCount}/{c.usageLimit} used</span> : <span className="text-slate-400">{c.usedCount} used</span>}
                                        {!c.active && <span className="rounded bg-slate-100 px-1.5 text-[10px] text-slate-500">inactive</span>}
                                        <button onClick={() => removeCoupon(c._id)} className="ml-auto rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-500"><Trash2 size={13} /></button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
