import { ShieldCheck } from "lucide-react";

function Section({ title, children }) {
    return (
        <section className="mt-8">
            <h2 className="text-xl font-bold text-slate-900">{title}</h2>
            <div className="mt-2 space-y-3 text-sm leading-relaxed text-slate-600">{children}</div>
        </section>
    );
}

export default function PrivacyPolicy() {
    return (
        <div className="mx-auto max-w-3xl px-4 pb-24 pt-32 sm:px-6">
            <div className="text-center">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-white px-3 py-1 text-xs font-semibold text-indigo-700 shadow-sm">
                    <ShieldCheck className="h-3.5 w-3.5" /> Privacy & Terms
                </span>
                <h1 className="mt-4 text-3xl font-bold text-slate-900 sm:text-4xl">Privacy Policy &amp; Terms of Use</h1>
                <p className="mt-2 text-sm text-slate-400">Last updated: July 2026</p>
            </div>

            <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                <p className="text-sm leading-relaxed text-slate-600">
                    OneLeet (&ldquo;OneLeet&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;) is a
                    learning platform for the Lateral Entry Entrance Test, owned and operated by{" "}
                    <strong className="text-slate-800">StaplerLabs Private Limited</strong>, Delhi, India. This page
                    explains what information we collect, how we use it, and the rules for using our platform and
                    its content. By creating an account or using OneLeet, you agree to this policy.
                </p>

                <Section title="1. Information We Collect">
                    <ul className="list-disc space-y-1.5 pl-5">
                        <li>Details you provide: name, email, phone number, password, and your passport-size photo.</li>
                        <li>Academic details you add: college, branch, year and target exam.</li>
                        <li>Activity on the platform: tests taken, papers viewed, scores and progress.</li>
                        <li>Technical data collected automatically: IP address, browser and device type, and pages visited.</li>
                    </ul>
                </Section>

                <Section title="2. How We Use Your Information">
                    <ul className="list-disc space-y-1.5 pl-5">
                        <li>To create and secure your account and verify your email.</li>
                        <li>To personalise your practice, track progress, and power the leaderboard.</li>
                        <li>To respond to your messages, bug reports, and callback requests.</li>
                        <li>To improve the platform and prevent misuse or fraud.</li>
                    </ul>
                    <p>We do <strong>not</strong> sell your personal data to anyone.</p>
                </Section>

                <Section title="3. Our Content &amp; Intellectual Property">
                    <p>
                        All study material on OneLeet — question banks, notes, mock tests, AI-generated content,
                        design, and branding — is provided <strong>solely for your personal exam preparation</strong>.
                    </p>
                    <p>
                        You may study, practise, and download materials for your own use. You may <strong>not</strong>{" "}
                        copy, scrape, republish, redistribute, resell, or share our content — in whole or in part —
                        on any other website, app, coaching service, or channel, whether free or paid, without our
                        prior written permission. All rights in the platform and its original content belong to
                        StaplerLabs Private Limited.
                    </p>
                    <p>
                        Previous-year papers and similar publicly available exam materials remain the property of
                        their respective conducting bodies and are shared here only to help students prepare.
                    </p>
                </Section>

                <Section title="4. Contributions">
                    <p>
                        If you submit a paper, question, or material to us, you confirm you have the right to share
                        it, and you grant OneLeet permission to review, edit, and publish it on the platform to help
                        other students.
                    </p>
                </Section>

                <Section title="5. Cookies">
                    <p>
                        We use essential cookies to keep you signed in and to remember your preferences. You can
                        disable cookies in your browser, but some features may stop working.
                    </p>
                </Section>

                <Section title="6. Data Sharing &amp; Storage">
                    <p>
                        Your data is stored securely and shared only with the trusted services that run OneLeet
                        (for example, our database, image/file hosting, and email provider), strictly to operate the
                        platform. We may disclose information if required by law.
                    </p>
                </Section>

                <Section title="7. Your Rights">
                    <ul className="list-disc space-y-1.5 pl-5">
                        <li>Access the personal data we hold about you.</li>
                        <li>Correct or update your information from your profile.</li>
                        <li>Request deletion of your account and data.</li>
                        <li>Withdraw consent at any time by closing your account.</li>
                    </ul>
                </Section>

                <Section title="8. Security">
                    <p>
                        Passwords are encrypted and sensitive traffic is protected. We take strong measures to keep
                        your data safe, though no method of transmission or storage can be guaranteed 100% secure.
                    </p>
                </Section>

                <Section title="9. Children">
                    <p>
                        OneLeet is intended for students preparing for lateral entry, generally aged 16 and above.
                        We do not knowingly collect data from children under 13.
                    </p>
                </Section>

                <Section title="10. Changes to This Policy">
                    <p>
                        We may update this policy from time to time. Significant changes will be reflected by the
                        &ldquo;last updated&rdquo; date above.
                    </p>
                </Section>

                <Section title="11. Contact Us">
                    <p>
                        Questions about this policy? Email us at{" "}
                        <a href="mailto:help@oneleet.in" className="font-semibold text-indigo-600 hover:underline">
                            help@oneleet.in
                        </a>
                        . <br />
                        StaplerLabs Private Limited, Delhi, India.
                    </p>
                </Section>
            </div>
        </div>
    );
}
