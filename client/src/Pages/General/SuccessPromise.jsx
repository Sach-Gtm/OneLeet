import { Link } from "react-router-dom";
import { ShieldCheck, Check, X, AlertTriangle, Info, FileText, ArrowRight } from "lucide-react";
import {
    LEGAL_UPDATED, LEGAL_ENTITY, SUCCESS_PROMISE_TABLE, ELIGIBILITY_CONDITIONS,
    VOID_CONDITIONS, PROTECTIONS, CLAIM_PROCESS, TERMS_OF_SERVICE, REFUND_POLICY,
} from "@/data/legal";

const Section = ({ id, icon, title, children }) => (
    <section id={id} className="scroll-mt-28 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900">
        <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-slate-100">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">{icon}</span>
            {title}
        </h2>
        <div className="mt-4 space-y-4 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{children}</div>
    </section>
);

export default function SuccessPromise() {
    return (
        <div className="mx-auto max-w-3xl px-4 pb-24 pt-28 sm:pt-32">
            <div className="text-center">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-300">
                    <ShieldCheck size={13} /> Success Promise &amp; Terms
                </span>
                <h1 className="mt-4 text-3xl font-extrabold text-slate-900 dark:text-slate-100">The Success Promise</h1>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{LEGAL_ENTITY} · {LEGAL_UPDATED}</p>
            </div>

            {/* Advocate sign-off disclaimer */}
            <div className="mt-6 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
                <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                <p>This is a launch draft prepared for clarity. It is pending review and sign-off by a practising Indian advocate before it becomes legally binding. The final terms shown at checkout will govern your purchase.</p>
            </div>

            <div className="mt-6 space-y-5">
                <Section id="promise" icon={<ShieldCheck size={16} />} title="What we promise, per exam">
                    <p>
                        The Success Promise is a <strong>performance-linked reward</strong>: meet the commitment for your
                        exam and complete all eligibility conditions, and if we don&apos;t deliver, you get money back. It is
                        not an unconditional guarantee of admission.
                    </p>
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[520px] text-left text-xs">
                            <thead>
                                <tr className="border-b border-slate-200 uppercase tracking-wide text-slate-400 dark:border-slate-700">
                                    <th className="py-2 pr-3 font-semibold">Exam</th>
                                    <th className="py-2 pr-3 font-semibold">What we commit to</th>
                                    <th className="py-2 font-semibold">Reward if not met</th>
                                </tr>
                            </thead>
                            <tbody>
                                {SUCCESS_PROMISE_TABLE.map((r) => (
                                    <tr key={r.exam} className="border-b border-slate-100 align-top dark:border-slate-800">
                                        <td className="py-2 pr-3 font-bold text-slate-800 dark:text-slate-100">{r.exam}</td>
                                        <td className="py-2 pr-3 text-slate-600 dark:text-slate-300">{r.commitment}</td>
                                        <td className="py-2 font-medium text-emerald-700 dark:text-emerald-400">{r.reward}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Section>

                <Section id="eligibility" icon={<Check size={16} />} title="Your side — eligibility conditions (all required)">
                    <ul className="space-y-2">
                        {ELIGIBILITY_CONDITIONS.map((c, i) => (
                            <li key={i} className="flex items-start gap-2"><Check size={15} className="mt-0.5 shrink-0 text-emerald-500" /><span>{c}</span></li>
                        ))}
                    </ul>
                </Section>

                <Section id="void" icon={<X size={16} />} title="When the reward is void">
                    <div className="space-y-3">
                        {VOID_CONDITIONS.map((g) => (
                            <div key={g.head}>
                                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{g.head}</p>
                                <ul className="mt-1 space-y-1">
                                    {g.items.map((it, i) => (
                                        <li key={i} className="flex items-start gap-2 text-xs"><X size={13} className="mt-0.5 shrink-0 text-rose-500" /><span>{it}</span></li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </Section>

                <Section id="protections" icon={<Info size={16} />} title="Additional protections">
                    <div className="space-y-3">
                        {PROTECTIONS.map((p) => (
                            <div key={p.head}>
                                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{p.head}</p>
                                <p className="text-xs">{p.body}</p>
                            </div>
                        ))}
                    </div>
                </Section>

                <Section id="claim" icon={<FileText size={16} />} title="How to claim a valid reward">
                    <ul className="space-y-2">
                        {CLAIM_PROCESS.map((c, i) => (
                            <li key={i} className="flex items-start gap-2"><span className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full bg-indigo-100 text-[10px] font-bold text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300">{i + 1}</span><span>{c}</span></li>
                        ))}
                    </ul>
                </Section>

                <Section id="terms" icon={<FileText size={16} />} title="Terms of Service">
                    <div className="space-y-3">
                        {TERMS_OF_SERVICE.map((t) => (
                            <div key={t.head}>
                                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{t.head}</p>
                                <p className="text-xs">{t.body}</p>
                            </div>
                        ))}
                    </div>
                </Section>

                <Section id="refund" icon={<X size={16} />} title="No-Refund policy">
                    <ul className="space-y-2">
                        {REFUND_POLICY.map((r, i) => (
                            <li key={i} className="flex items-start gap-2"><Info size={14} className="mt-0.5 shrink-0 text-slate-400" /><span>{r}</span></li>
                        ))}
                    </ul>
                </Section>
            </div>

            <div className="mt-8 text-center">
                <Link to="/pricing" className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-indigo-700">
                    Back to pricing <ArrowRight size={16} />
                </Link>
            </div>
        </div>
    );
}
