import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Bug, Loader2, Upload, CheckCircle2, ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";
import { submitBug } from "@/Api/ContactApi";

const inputCls =
    "h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20";

export default function BugReport() {
    const fileRef = useRef(null);
    const [form, setForm] = useState({ name: "", email: "", description: "" });
    const [file, setFile] = useState(null);
    const [busy, setBusy] = useState(false);
    const [done, setDone] = useState(false);
    const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

    const submit = async (e) => {
        e.preventDefault();
        if (!form.description.trim()) return toast.error("Please describe the bug.");
        if (file && file.size > 5 * 1024 * 1024) return toast.error("Screenshot must be 5 MB or smaller.");
        setBusy(true);
        try {
            const fd = new FormData();
            Object.entries(form).forEach(([k, v]) => v && fd.append(k, v));
            if (file) fd.append("file", file);
            const res = await submitBug(fd);
            toast.success(res?.message || "Thanks!");
            setDone(true);
        } catch (err) {
            toast.error(err.message);
        } finally {
            setBusy(false);
        }
    };

    if (done) {
        return (
            <div className="mx-auto max-w-xl px-4 pb-24 pt-40 text-center sm:px-6">
                <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-100 text-emerald-600">
                    <CheckCircle2 className="h-8 w-8" />
                </span>
                <h1 className="mt-5 text-2xl font-bold text-slate-900">Report received — thank you!</h1>
                <p className="mx-auto mt-2 max-w-md text-slate-500">
                    We&apos;ve logged it and will look into it. If it&apos;s urgent, email us at{" "}
                    <a href="mailto:help@oneleet.in" className="font-medium text-indigo-600">help@oneleet.in</a>.
                </p>
                <Link to="/" className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:underline">
                    <ArrowLeft size={15} /> Back to home
                </Link>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-xl px-4 pb-24 pt-32 sm:px-6">
            <div className="mb-8 text-center">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-white px-3 py-1 text-xs font-semibold text-rose-600 shadow-sm">
                    <Bug className="h-3.5 w-3.5" /> Report a Bug
                </span>
                <h1 className="mt-4 text-3xl font-bold text-slate-900">Spotted something broken?</h1>
                <p className="mx-auto mt-2 max-w-md text-slate-500">
                    Tell us what happened and we&apos;ll fix it fast. A screenshot helps a lot.
                </p>
            </div>

            <form onSubmit={submit} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block">
                        <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Your name</span>
                        <input className={inputCls} value={form.name} onChange={set("name")} placeholder="Optional" />
                    </label>
                    <label className="block">
                        <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Email</span>
                        <input className={inputCls} type="email" value={form.email} onChange={set("email")} placeholder="So we can follow up" />
                    </label>
                </div>

                <label className="block">
                    <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">What went wrong? *</span>
                    <textarea
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        rows={5}
                        value={form.description}
                        onChange={set("description")}
                        placeholder="What were you doing, what did you expect, and what actually happened?"
                    />
                </label>

                <div>
                    <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Screenshot (optional)</span>
                    <input
                        ref={fileRef}
                        type="file"
                        accept="image/*"
                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                        className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-slate-700 hover:file:bg-slate-200"
                    />
                </div>

                <button
                    type="submit"
                    disabled={busy}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-700 disabled:opacity-60"
                >
                    {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    Send report
                </button>
            </form>
        </div>
    );
}
