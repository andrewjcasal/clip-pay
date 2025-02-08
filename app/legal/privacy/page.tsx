import Link from "next/link"

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-white">
      <main className="max-w-3xl mx-auto px-4 py-12">
        <article className="prose prose-zinc lg:prose-lg max-w-none">
          <h1 className="text-zinc-900">Privacy Policy</h1>
          <p className="text-zinc-600">
            Effective Date: February 7, 2025
            <br />
            Last Updated: February 7, 2025
          </p>

          <h2 className="text-zinc-900">1. Introduction</h2>
          <p className="text-zinc-700">
            Welcome to Clip Pay. We value your privacy and are committed to
            protecting your personal data. This Privacy Policy explains how we
            collect, use, disclose, and safeguard your information when you use
            our app.
          </p>

          <h2 className="text-zinc-900">2. Information We Collect</h2>
          <ul className="text-zinc-700">
            <li>
              Personal Information: When you sign up or interact with Clip Pay,
              we may collect personal data like your name, email address, and
              TikTok account information (if applicable).
            </li>
            <li>
              Usage Data: We collect information about how you interact with the
              app, such as access times, pages viewed, and other diagnostic
              data.
            </li>
            <li>
              TikTok API Data: If you connect your TikTok account, we may
              collect data from TikTok according to their API permissions.
            </li>
          </ul>

          <h2 className="text-zinc-900">3. How We Use Your Information</h2>
          <p className="text-zinc-700">We use the information we collect to:</p>
          <ul className="text-zinc-700">
            <li>Provide, operate, and maintain Clip Pay.</li>
            <li>Improve user experience and develop new features.</li>
            <li>
              Communicate with you about updates, promotions, and support.
            </li>
            <li>
              Comply with legal obligations and enforce our Terms of Service.
            </li>
          </ul>

          <h2 className="text-zinc-900">4. Sharing Your Information</h2>
          <p className="text-zinc-700">
            We do not sell or rent your personal information. We may share your
            data with:
          </p>
          <ul className="text-zinc-700">
            <li>
              Service Providers: To help us operate Clip Pay (e.g., hosting
              providers).
            </li>
            <li>
              Legal Authorities: If required by law or to protect our legal
              rights.
            </li>
          </ul>

          <h2 className="text-zinc-900">5. Data Security</h2>
          <p className="text-zinc-700">
            We implement reasonable security measures to protect your personal
            data. However, no system is completely secure, and we cannot
            guarantee absolute security.
          </p>

          <h2 className="text-zinc-900">6. Your Rights</h2>
          <p className="text-zinc-700">
            You have the right to access, correct, or delete your personal
            information. To exercise these rights, please contact us at
            mrketrlabs@gmail.com.
          </p>

          <h2 className="text-zinc-900">7. Changes to This Privacy Policy</h2>
          <p className="text-zinc-700">
            We may update this Privacy Policy from time to time. We encourage
            you to review it periodically.
          </p>

          <h2 className="text-zinc-900">8. Contact Us</h2>
          <p className="text-zinc-700">
            If you have any questions about this Privacy Policy, please contact
            us at{" "}
            <a
              href="mailto:mrketrlabs@gmail.com"
              className="text-blue-600 hover:text-blue-800"
            >
              mrketrlabs@gmail.com
            </a>
            .
          </p>

          <div className="mt-8 border-t pt-8">
            <Link
              href="/legal/terms"
              className="text-blue-600 hover:text-blue-800 no-underline"
            >
              View Terms of Service
            </Link>
          </div>
        </article>
      </main>
    </div>
  )
}
