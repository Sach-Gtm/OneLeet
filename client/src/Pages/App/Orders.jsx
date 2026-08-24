import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { Loader2, Package, Mail, ArrowRight } from "lucide-react";
import { getMyOrders, payInstallment, verifyPayment } from "@/Api/PaymentsApi";

const rupee = (n) => "₹" + Number(n || 0).toLocaleString("en-IN");
const fmt = (d) => (d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "");

const STATUS = {
    created: { label: "Awaiting payment", cls: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400" },
    partially_paid: { label: "Installment 1 paid", cls: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400" },
    paid: { label: "Paid", cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400" },
    locked: { label: "Payment lapsed", cls: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400" },
    cancelled: { label: "Cancelled", cls: "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300" },
};

export default function Orders() {
    const [orders, setOrders] = useState(null);
    const [busy, setBusy] = useState("");

    const reload = () => getMyOrders().then(setOrders).catch(() => setOrders([]));
    useEffect(() => { reload(); }, []);

    async function onPayNext(order) {
        setBusy(order._id);
        try {
            const { gateway } = await payInstallment(order._id);
            if (gateway.live && window.Razorpay) {
                const rzp = new window.Razorpay({
                    key: gateway.keyId, amount: gateway.amount * 100, currency: "INR", name: "OneLeet",
                    order_id: gateway.orderId,
                    handler: async (resp) => {
                        await verifyPayment({ orderId: order._id, installmentN: 2, razorpay_order_id: resp.razorpay_order_id, razorpay_payment_id: resp.razorpay_payment_id, razorpay_signature: resp.razorpay_signature });
                        toast.success("Second installment paid, full access unlocked!");
                        reload();
                    },
                    theme: { color: "#4f46e5" },
                });
                rzp.open();
            } else {
                toast.success("Payment initiated, our team will confirm by email shortly.");
            }
        } catch (e) {
            toast.error(e.message || "Could not start the payment");
        } finally {
            setBusy("");
        }
    }

    if (orders === null) return <div className="flex h-48 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-indigo-600" /></div>;

    return (
        <div className="mx-auto max-w-2xl">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">My orders</h1>

            {orders.length === 0 ? (
                <div className="mt-8 rounded-2xl border border-dashed border-slate-300 p-10 text-center dark:border-slate-700">
                    <Package className="mx-auto h-9 w-9 text-slate-300" />
                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">No orders yet.</p>
                    <Link to="/pricing" className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:underline dark:text-indigo-400">Browse batches <ArrowRight size={14} /></Link>
                </div>
            ) : (
                <div className="mt-5 space-y-3">
                    {orders.map((o) => {
                        const st = STATUS[o.status] || STATUS.created;
                        const second = o.installments?.find((i) => i.n === 2);
                        const canPaySecond = o.paymentPlan === "split" && o.status === "partially_paid" && second?.status === "pending";
                        return (
                            <div key={o._id} className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{o.items.map((i) => i.courseName).join(", ")}</p>
                                    <span className={"rounded-full px-2.5 py-0.5 text-[11px] font-bold " + st.cls}>{st.label}</span>
                                </div>
                                <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                                    <span>{fmt(o.createdAt)}</span>
                                    <span>{o.paymentPlan === "split" ? "Split payment" : "Paid in full"}</span>
                                    <span>Paid {rupee(o.amountPaid)} / {rupee(o.payable)}</span>
                                    {o.grantsPremiumUntil && o.status !== "locked" && <span>Access until {fmt(o.grantsPremiumUntil)}</span>}
                                </div>

                                {canPaySecond && (
                                    <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg bg-blue-50 p-3 dark:bg-blue-500/10">
                                        <p className="flex-1 text-xs text-blue-700 dark:text-blue-300">
                                            Second installment of <strong>{rupee(second.amount)}</strong> due by {fmt(second.dueAt)} (grace {fmt(second.graceUntil)}).
                                        </p>
                                        <button onClick={() => onPayNext(o)} disabled={busy === o._id} className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-bold text-white hover:bg-indigo-700 disabled:opacity-60">
                                            {busy === o._id ? <Loader2 size={13} className="animate-spin" /> : null} Pay {rupee(second.amount)}
                                        </button>
                                    </div>
                                )}
                                {o.status === "locked" && (
                                    <a href={`mailto:help@oneleet.in?subject=${encodeURIComponent(`Resume payment on order ${o._id}`)}`} className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700">
                                        <Mail size={13} /> Contact us to resume
                                    </a>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
