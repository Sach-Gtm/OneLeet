import { useEffect, useState, useCallback } from "react";
import { Ban, Loader2, Plus, Undo2 } from "lucide-react";
import toast from "react-hot-toast";
import { getBlocklist, blockEmail, unblockEmail } from "@/Api/AdminApi";

// Super-admin control for the account block-list: who is barred from holding an
// account. Removing a user auto-adds them here; this is where you review and
// lift blocks, or block an email by hand.
export default function BlocklistAdmin() {
    const [rows, setRows] = useState(null);
    const [email, setEmail] = useState("");
    const [busy, setBusy] = useState(false);

    const load = useCallback(() => {
        getBlocklist()
            .then(setRows)
            .catch(() => setRows([]));
    }, []);
    useEffect(() => {
        load();
    }, [load]);

    const add = async (e) => {
        e.preventDefault();
        const v = email.trim();
        if (!v) return;
        setBusy(true);
        try {
            const r = await blockEmail(v);
            toast.success(r.message || "Blocked");
            setEmail("");
            load();
        } catch (err) {
            toast.error(err.message || "Couldn't block");
        } finally {
            setBusy(false);
        }
    };

    const lift = async (addr) => {
        if (!window.confirm(`Unblock ${addr}? They'll be able to register again.`)) return;
        try {
            const r = await unblockEmail(addr);
            toast.success(r.message || "Unblocked");
            load();
        } catch (err) {
            toast.error(err.message || "Couldn't unblock");
        }
    };

    return (
        <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-800">
                <Ban className="h-4 w-4 text-rose-500" /> Blocked accounts
                <span className="font-normal text-slate-400">— can't register or sign in</span>
            </div>

            <form onSubmit={add} className="mb-3 flex flex-wrap gap-2">
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Block an email address…"
                    className="h-9 min-w-0 flex-1 rounded-lg border border-slate-200 px-3 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
                <button
                    type="submit"
                    disabled={busy}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
                >
                    {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                    Block
                </button>
            </form>

            {rows === null ? (
                <div className="flex justify-center py-6">
                    <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
                </div>
            ) : rows.length === 0 ? (
                <p className="rounded-lg border border-dashed border-slate-200 py-6 text-center text-sm text-slate-400">
                    No blocked accounts. Removing a user adds them here automatically.
                </p>
            ) : (
                <ul className="divide-y divide-slate-100">
                    {rows.map((b) => (
                        <li key={b._id} className="flex flex-wrap items-center gap-2 py-2.5">
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium text-slate-700">{b.email}</p>
                                <p className="truncate text-xs text-slate-400">
                                    {b.reason}
                                    {b.createdBy?.name ? ` · by ${b.createdBy.name}` : ""}
                                </p>
                            </div>
                            <button
                                onClick={() => lift(b.email)}
                                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                            >
                                <Undo2 className="h-3.5 w-3.5" /> Unblock
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
