import Link from "next/link"

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 page-fade">
      <article className="prose prose-invert max-w-none">
        <h1 className="text-3xl font-bold text-foreground">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground">Last updated: February 26, 2026</p>

        <div className="mt-8 space-y-6 text-sm leading-relaxed text-muted-foreground">
          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">1. Information We Collect</h2>
            <p>When you use GuruBox.ai, we collect information you provide directly, including your Google account profile (name, email, avatar) when you sign in, and the product directions you submit for analysis.</p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">2. How We Use Your Information</h2>
            <p>We use your information to provide and improve our AI analysis services, generate opportunity reports, and maintain your account. We do not sell your personal information to third parties.</p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">3. Data Storage and Security</h2>
            <p>Your data is stored securely using industry-standard encryption. Analysis reports are associated with your account and can be deleted at any time. We retain deleted reports for 30 days before permanent removal.</p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">4. Third-Party Services</h2>
            <p>We use Google OAuth for authentication and AI language models for analysis. These services have their own privacy policies that govern their handling of your data.</p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">5. Your Rights</h2>
            <p>You have the right to access, modify, or delete your personal data at any time through your account settings. You may also request a complete data export.</p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">6. Contact</h2>
            <p>For privacy-related inquiries, please contact us at privacy@gurubox.ai.</p>
          </section>
        </div>

        <div className="mt-8">
          <Link href="/tools/product-insight" className="text-sm text-primary underline underline-offset-4">
            Back to Home
          </Link>
        </div>
      </article>
    </div>
  )
}
