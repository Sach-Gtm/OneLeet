import React from 'react';

const PrivacyPolicy = () => {
    return (
        <div className="max-w-4xl mx-auto p-6 text-white leading-relaxed mt-30">
            <h1 className="text-3xl font-bold mb-4">Privacy Policy</h1>
            <p className="mb-4">Last updated: December 10, 2025</p>

            <p className="mb-4">
                This Privacy Policy explains how <strong>YourAppName</strong> (“Company”, “We”, “Us”, or “Our”)
                collects, uses, and protects your information when you access or use our website, application,
                or related services (“Service”). By using the Service, you agree to the practices described in this Privacy Policy.
            </p>

            <h2 className="text-2xl font-semibold mt-6 mb-2">Interpretation and Definitions</h2>

            <h3 className="text-xl font-semibold mt-4 mb-2">Interpretation</h3>
            <p className="mb-4">
                Capitalized words have defined meanings below. These definitions apply whether used in singular or plural form.
            </p>

            <h3 className="text-xl font-semibold mt-4 mb-2">Definitions</h3>

            <ul className="list-disc ml-6 mb-4 space-y-2">
                <li><strong>Account</strong>: A unique account created for You to access our Service.</li>
                <li><strong>Affiliate</strong>: Any entity controlling, controlled by, or under common control with the Company.</li>
                <li><strong>Company</strong>: Refers to <strong>YourAppName</strong>, based in <strong>Delhi, India</strong>.</li>
                <li><strong>Cookies</strong>: Small files stored on Your device to record browsing activity.</li>
                <li><strong>Device</strong>: Any device capable of accessing the Service.</li>
                <li><strong>Personal Data</strong>: Any information that identifies an individual.</li>
                <li><strong>Service</strong>: The platform, website, or application owned by the Company.</li>
                <li><strong>Website</strong>: Refers to <strong>YourAppName</strong> at <strong>https://yourdomain.com</strong>.</li>
                <li><strong>You</strong>: The individual or entity accessing the Service.</li>
            </ul>

            <h2 className="text-2xl font-semibold mt-6 mb-2">Collecting and Using Your Personal Data</h2>

            <h3 className="text-xl font-semibold mt-4 mb-2">Personal Data We Collect</h3>

            <p className="mb-4">We may collect the following information:</p>
            <ul className="list-disc ml-6 mb-4 space-y-2">
                <li>Name</li>
                <li>Email Address</li>
                <li>Profile Picture (via Google Login)</li>
                <li>Account preferences</li>
            </ul>

            <h3 className="text-xl font-semibold mt-4 mb-2">Usage Data</h3>

            <p className="mb-4">Usage data is collected automatically and may include:</p>
            <ul className="list-disc ml-6 mb-4 space-y-2">
                <li>IP Address</li>
                <li>Browser type & version</li>
                <li>Pages visited</li>
                <li>Time spent</li>
                <li>Device identifiers</li>
                <li>Mobile device model and OS (if applicable)</li>
            </ul>

            <h2 className="text-2xl font-semibold mt-6 mb-2">Cookies and Tracking Technologies</h2>

            <p className="mb-4">
                We use cookies to improve your user experience. You can disable cookies in your browser settings,
                but some features may not work properly.
            </p>

            <h3 className="text-xl font-semibold mt-4 mb-2">Types of Cookies:</h3>

            <ul className="list-disc ml-6 mb-4 space-y-2">
                <li><strong>Essential Cookies</strong>: Required for authentication and basic features.</li>
                <li><strong>Preference Cookies</strong>: Store your settings like login preferences.</li>
                <li><strong>Analytical Cookies</strong>: Help analyze user behavior to improve our Service.</li>
            </ul>

            <h2 className="text-2xl font-semibold mt-6 mb-2">How We Use Your Data</h2>

            <ul className="list-disc ml-6 mb-4 space-y-2">
                <li>To operate and maintain the Service</li>
                <li>To manage user accounts</li>
                <li>To contact you when needed</li>
                <li>To provide customer support</li>
                <li>To analyze usage and improve the experience</li>
                <li>To prevent fraudulent or illegal activity</li>
            </ul>

            <h2 className="text-2xl font-semibold mt-6 mb-2">Data Retention</h2>

            <p className="mb-4">
                We retain data only as long as necessary to fulfill the purposes outlined in this policy,
                comply with legal obligations, and improve our services.
            </p>

            <h2 className="text-2xl font-semibold mt-6 mb-2">Your Rights</h2>

            <ul className="list-disc ml-6 mb-4 space-y-2">
                <li>Right to access your data</li>
                <li>Right to request deletion</li>
                <li>Right to correct inaccurate data</li>
                <li>Right to withdraw consent</li>
            </ul>

            <h2 className="text-2xl font-semibold mt-6 mb-2">Security of Your Data</h2>

            <p className="mb-4">
                We implement strong security measures to protect your personal data,
                but no method of transmission or storage is 100% secure.
            </p>

            <h2 className="text-2xl font-semibold mt-6 mb-2">Contact Us</h2>

            <p className="mb-4">
                If you have any questions about this Privacy Policy, you may contact us at:
            </p>

            <p>Email: <strong>yourapp@gmail.com</strong></p>
            <p>Location: <strong>Delhi, India</strong></p>
        </div>
    );
};

export default PrivacyPolicy;
