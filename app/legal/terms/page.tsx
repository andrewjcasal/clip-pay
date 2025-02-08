import Link from "next/link"

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-white">
      <main className="max-w-3xl mx-auto px-4 py-12">
        <article className="prose prose-zinc lg:prose-lg max-w-none">
          <h1 className="text-zinc-900">Terms of Service</h1>
          <p className="text-zinc-600">
            Effective Date: February 7, 2025
            <br />
            Last Updated: February 7, 2025
          </p>

          <h2 className="text-zinc-900">1. Acceptance of Terms</h2>
          <p className="text-zinc-700">
            By using Clip Pay ("the App"), you agree to comply with these Terms
            of Service. If you do not agree, please do not use the App.
          </p>

          <h2 className="text-zinc-900">2. Use of the App</h2>
          <ul className="text-zinc-700">
            <li>You must be at least 13 years old to use Clip Pay.</li>
            <li>
              You agree not to use the App for any illegal or unauthorized
              purposes.
            </li>
            <li>
              You are responsible for maintaining the confidentiality of your
              account credentials.
            </li>
          </ul>

          <h2 className="text-zinc-900">3. TikTok API Usage</h2>
          <p className="text-zinc-700">
            If the App connects to TikTok's API, you agree to comply with
            TikTok's API terms and conditions. We are not responsible for any
            changes or issues arising from TikTok's platform.
          </p>

          <h2 className="text-zinc-900">4. Intellectual Property</h2>
          <p className="text-zinc-700">
            All content, trademarks, and intellectual property in Clip Pay
            belong to Clip Pay. You may not reproduce or distribute any part of
            the App without our written permission.
          </p>

          <h2 className="text-zinc-900">5. Termination</h2>
          <p className="text-zinc-700">
            We reserve the right to suspend or terminate your access to the App
            if you violate these Terms.
          </p>

          <h2 className="text-zinc-900">6. Limitation of Liability</h2>
          <p className="text-zinc-700">
            The App is provided "as is" without warranties of any kind. We are
            not liable for any indirect, incidental, or consequential damages
            resulting from your use of the App.
          </p>

          <h2 className="text-zinc-900">7. Governing Law</h2>
          <p className="text-zinc-700">
            These Terms are governed by the laws of California, United States,
            without regard to its conflict of law principles.
          </p>

          <h2 className="text-zinc-900">8. Changes to Terms</h2>
          <p className="text-zinc-700">
            We may modify these Terms of Service at any time. Continued use of
            the App constitutes acceptance of the revised terms.
          </p>

          <h2 className="text-zinc-900">9. Contact Us</h2>
          <p className="text-zinc-700">
            For any questions regarding these Terms, please contact us at{" "}
            <a
              href="mailto:mrketrlabs@gmail.com"
              className="text-blue-600 hover:text-blue-800 no-underline"
            >
              mrketrlabs@gmail.com
            </a>
            .
          </p>

          <div className="mt-8 border-t pt-8">
            <Link
              href="/legal/privacy"
              className="text-blue-600 hover:text-blue-800 no-underline"
            >
              View Privacy Policy
            </Link>
          </div>
        </article>
      </main>
    </div>
  )
}
