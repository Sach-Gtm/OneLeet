import { useMemo, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
    ShoppingCart, Trash2, ShieldCheck, Check, Loader2, CreditCard,
    Split, Wallet, ArrowRight, MessageCircle, Sparkles, X,
} from "lucide-react";
import { useCart } from "@/context/CartContext";
import { createOrder, applyCoupon, verifyPayment } from "@/Api/PaymentsApi";
import { track } from "@/lib/telemetry";
import { useCelebrate } from "@/context/CelebrationContext";
import { SPLIT_SURCHARGE } from "@/data/pricing";
import { whatsappLink, WHATSAPP_RESPONSE } from "@/config/support";

const rupee = (n) => "₹" + Number(n || 0).toLocaleString("en-IN");
const SURCHARGE = 1.3; // split payment costs 30% more (mirrors server)

export default function Checkout() {
    const { items, totals, remove, clear, count } = useCart();
    const navigate = useNavigate();

    const [plan, setPlan] = useState("full");
    const [couponInput, setCouponInput] = useState("");
    const [coupon, setCoupon] = useState(null); // { code, discount }
    const [couponBusy, setCouponBusy] = useState(false);
    const [referral, setReferral] = useState("");
    const [ticks, setTicks] = useState({ terms: false, successPromise: false, noRefund: false });
    const [placing, setPlacing] = useState(false);
    const [placed, setPlaced] = useState(null); // the created order (manual mode)
    const { celebrate } = useCelebrate();

    // Money (mirrors the server): cart discount → coupon → split surcharge.
    const money = useMemo(() => {
        const afterCart = totals.total; // subtotal − whole-cart tier discount
        const couponDiscount = coupon ? Math.min(coupon.discount, afterCart) : 0;
        const baseTotal = Math.max(0, afterCart - couponDiscount);
        const payable = plan === "split" ? Math.round(baseTotal * SURCHARGE) : baseTotal;
        const half = Math.round(payable / 2);
        return { afterCart, couponDiscount, baseTotal, payable, installments: [half, payable - half] };
    }, [totals, coupon, plan]);

    const allTicked = ticks.terms && ticks.successPromise && ticks.noRefund;

    // Funnel: reached checkout (audit C3).
    useEffect(() => {
        track("checkout_start");
    }, []);

    async function onApplyCoupon() {
        if (!couponInput.trim()) return;
        setCouponBusy(true);
        try {
            const res = await applyCoupon(couponInput.trim(), totals.total);
            setCoupon({ code: res.code, discount: res.discount });
            toast.success(`Coupon ${res.code} applied — ${rupee(res.discount)} off`);
        } catch (e) {
            setCoupon(null);
            toast.error(e.message || "Invalid coupon");
        } finally {
            setCouponBusy(false);
        }
    }

    // Open Razorpay if the gateway is live + its script is loaded; otherwise fall
    // back to the manual "we'll confirm" notice. This is the seam that goes live
    // when the founder adds the Razorpay key + checkout script.
    function openRazorpay(order, gateway) {
        if (gateway.live && typeof window !== "undefined" && window.Razorpay) {
            const rzp = new window.Razorpay({
                key: gateway.keyId,
                amount: gateway.amount * 100,
                currency: "INR",
                name: "OneLeet",
                description: order.items.map((i) => i.courseName).join(", "),
                order_id: gateway.orderId,
                handler: async (resp) => {
                    try {
                        await verifyPayment({
                            orderId: order._id,
                            installmentN: 1,
                            razorpay_order_id: resp.razorpay_order_id,
                            razorpay_payment_id: resp.razorpay_payment_id,
                            razorpay_signature: resp.razorpay_signature,
                        });
                        track("payment_done"); // funnel: paid (audit C3)
                        clear();
                        celebrate("premium"); // went-Premium doodle (persists across the navigate)
                        toast.success("Payment successful — welcome to Premium!");
                        navigate("/dashboard");
                    } catch (e) {
                        toast.error(e.message || "Payment verification failed");
                    }
                },
                theme: { color: "#4f46e5" },
            });
            rzp.open();
            return true;
        }
        return false;
    }

    async function onPlaceOrder() {
        if (!allTicked) return toast.error("Please accept all three policies to continue.");
        setPlacing(true);
        try {
            const { order, gateway } = await createOrder({
                slugs: items.map((i) => i.slug),
                plan,
                couponCode: coupon?.code || "",
                referralCode: referral.trim(),
                acceptedTerms: ticks,
            });
            // Live gateway → open Razorpay. Manual mode → show the confirm notice.
            if (!openRazorpay(order, gateway)) {
                setPlaced(order);
                clear();
            }
        } catch (e) {
            toast.error(e.message || "Could not place the order");
        } finally {
            setPlacing(false);
        }
    }

    // ── Success (manual mode): order placed, awaiting confirmation ──
    if (placed) {
        return (
            <div className="mx-auto max-w-lg py-10 text-center">
                <div className="grid h-16 w-16 mx-auto place-items-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15">
                    <Check size={30} />
                </div>
                <h1 className="mt-4 text-2xl font-bold text-slate-900 dark:text-slate-100">Order placed!</h1>
                <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500 dark:text-slate-400">
                    Your order for <strong>{placed.items.map((i) => i.courseName).join(", ")}</strong> is reserved.
                    To activate premium, complete the payment of <strong>{rupee(placed.installments[0].amount)}</strong> —
                    our team will share the payment details and confirm on WhatsApp {WHATSAPP_RESPONSE}.
                </p>
                <a
                    href={whatsappLink(`Hi OneLeet, I placed order ${placed._id} and want to complete payment.`)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-5 inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700"
                >
                    <MessageCircle size={16} /> Complete payment on WhatsApp
                </a>
                <div className="mt-3">
                    <Link to="/orders" className="text-sm font-semibold text-indigo-600 hover:underline dark:text-indigo-400">View my orders →</Link>
                </div>
            </div>
        );
    }

    // ── Empty cart ──
    if (count === 0) {
        return (
            <div className="mx-auto max-w-md py-16 text-center">
                <ShoppingCart className="mx-auto h-10 w-10 text-slate-300" />
                <h1 className="mt-3 text-xl font-bold text-slate-900 dark:text-slate-100">Your cart is empty</h1>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Add an exam batch to get started.</p>
                <Link to="/pricing" className="mt-4 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-indigo-700">
                    Browse batches <ArrowRight size={16} />
                </Link>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-2xl pb-16">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Checkout</h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Review your batches, choose how to pay, and accept the policies.</p>

            {/* Items */}
            <div className="mt-5 space-y-2">
                {items.map((i) => (
                    <div key={i.slug} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400"><Sparkles size={16} /></span>
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">{i.name}</p>
                            <p className="truncate text-xs text-slate-400">{i.subtitle}</p>
                        </div>
                        <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{rupee(i.price)}</span>
                        <button onClick={() => remove(i.slug)} className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-rose-500 dark:hover:bg-slate-800" title="Remove">
                            <Trash2 size={15} />
                        </button>
                    </div>
                ))}
            </div>

            {/* Payment plan */}
            <div className="mt-6">
                <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">How would you like to pay?</h2>
                <div className="mt-2 grid gap-3 sm:grid-cols-2">
                    <button
                        type="button"
                        onClick={() => setPlan("full")}
                        className={"rounded-xl border p-4 text-left transition " + (plan === "full" ? "border-indigo-500 bg-indigo-50/60 ring-1 ring-indigo-500 dark:bg-indigo-500/10" : "border-slate-200 dark:border-slate-700")}
                    >
                        <p className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-slate-100"><Wallet size={15} /> Pay in full</p>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">One payment of {rupee(money.baseTotal)}. Best value.</p>
                    </button>
                    <button
                        type="button"
                        onClick={() => setPlan("split")}
                        className={"rounded-xl border p-4 text-left transition " + (plan === "split" ? "border-indigo-500 bg-indigo-50/60 ring-1 ring-indigo-500 dark:bg-indigo-500/10" : "border-slate-200 dark:border-slate-700")}
                    >
                        <p className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-slate-100"><Split size={15} /> Split payment</p>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            2 × {rupee(money.installments[0])} (total {rupee(Math.round(money.baseTotal * SURCHARGE))}, {SPLIT_SURCHARGE}% more).
                        </p>
                    </button>
                </div>
                {plan === "split" && (
                    <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-[11px] text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
                        Pay {rupee(money.installments[0])} now for 30 days of premium (+3 days grace). Pay the second {rupee(money.installments[1])} within that window to keep full access — miss it and premium pauses (free features stay) until you resume.
                    </p>
                )}
            </div>

            {/* Coupon + referral */}
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <div>
                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Coupon code</label>
                    <div className="mt-1 flex gap-2">
                        <input
                            value={couponInput}
                            onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                            placeholder="e.g. LEET100"
                            className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                        />
                        {coupon ? (
                            <button onClick={() => { setCoupon(null); setCouponInput(""); }} className="rounded-lg border border-slate-300 px-3 text-slate-500 dark:border-slate-600" title="Remove"><X size={15} /></button>
                        ) : (
                            <button onClick={onApplyCoupon} disabled={couponBusy} className="rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white disabled:opacity-60 dark:bg-slate-100 dark:text-slate-900">
                                {couponBusy ? <Loader2 size={15} className="animate-spin" /> : "Apply"}
                            </button>
                        )}
                    </div>
                    {coupon && <p className="mt-1 text-[11px] font-medium text-emerald-600">✓ {coupon.code} — {rupee(coupon.discount)} off</p>}
                </div>
                <div>
                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Referral code <span className="font-normal text-slate-400">(optional)</span></label>
                    <input
                        value={referral}
                        onChange={(e) => setReferral(e.target.value.toUpperCase())}
                        placeholder="Friend's code"
                        className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                    />
                </div>
            </div>

            {/* Summary */}
            <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm dark:border-slate-700 dark:bg-slate-800/40">
                <Row label="Subtotal" value={rupee(totals.subtotal)} />
                {totals.discount > 0 && <Row label={`Multi-course discount (${totals.pct}%${totals.capped ? ", capped" : ""})`} value={`− ${rupee(totals.discount)}`} good />}
                {money.couponDiscount > 0 && <Row label={`Coupon ${coupon.code}`} value={`− ${rupee(money.couponDiscount)}`} good />}
                {plan === "split" && <Row label={`Split-payment surcharge (${SPLIT_SURCHARGE}%)`} value={`+ ${rupee(money.payable - money.baseTotal)}`} />}
                <div className="mt-2 flex items-center justify-between border-t border-slate-200 pt-2 dark:border-slate-700">
                    <span className="font-bold text-slate-900 dark:text-slate-100">{plan === "split" ? "Total (in 2 installments)" : "Total payable"}</span>
                    <span className="text-lg font-extrabold text-slate-900 dark:text-slate-100">{rupee(money.payable)}</span>
                </div>
            </div>

            {/* T&C ticks */}
            <div className="mt-6 space-y-2.5">
                <Tick checked={ticks.terms} onChange={(v) => setTicks((t) => ({ ...t, terms: v }))}>
                    I accept the <Link to="/terms" target="_blank" className="text-indigo-600 hover:underline dark:text-indigo-400">Terms of Service</Link>.
                </Tick>
                <Tick checked={ticks.successPromise} onChange={(v) => setTicks((t) => ({ ...t, successPromise: v }))}>
                    I understand the <Link to="/success-promise" target="_blank" className="text-indigo-600 hover:underline dark:text-indigo-400">Success Promise</Link> and its eligibility conditions.
                </Tick>
                <Tick checked={ticks.noRefund} onChange={(v) => setTicks((t) => ({ ...t, noRefund: v }))}>
                    I accept the <Link to="/success-promise#refund" target="_blank" className="text-indigo-600 hover:underline dark:text-indigo-400">No-Refund policy</Link> (refunds only via the Success Promise).
                </Tick>
            </div>

            <button
                type="button"
                onClick={onPlaceOrder}
                disabled={!allTicked || placing}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3.5 text-sm font-bold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
                {placing ? <Loader2 size={18} className="animate-spin" /> : <CreditCard size={18} />}
                {plan === "split" ? `Pay ${rupee(money.installments[0])} now` : `Pay ${rupee(money.payable)}`}
            </button>
            <p className="mt-2 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
                <ShieldCheck size={12} /> Secure payment · enrolling unlocks full premium access for your batch
            </p>
        </div>
    );
}

const Row = ({ label, value, good }) => (
    <div className="flex items-center justify-between py-0.5">
        <span className="text-slate-500 dark:text-slate-400">{label}</span>
        <span className={good ? "font-semibold text-emerald-600" : "text-slate-700 dark:text-slate-200"}>{value}</span>
    </div>
);

const Tick = ({ checked, onChange, children }) => (
    <label className="flex cursor-pointer items-start gap-2.5 text-xs text-slate-600 dark:text-slate-300">
        <button
            type="button"
            onClick={() => onChange(!checked)}
            className={"mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded border transition " + (checked ? "border-indigo-600 bg-indigo-600 text-white" : "border-slate-300 dark:border-slate-600")}
        >
            {checked && <Check size={13} />}
        </button>
        <span>{children}</span>
    </label>
);
