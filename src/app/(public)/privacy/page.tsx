import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — AutoSocial Automation",
  description: "Privacy policy for the AutoSocial Social Media Page Automation Tool.",
  robots: { index: false, follow: false },
};

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-gray-950 text-gray-100 py-16 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-2 text-white">Privacy Policy</h1>
        <p className="text-gray-400 text-sm mb-10">Last updated: October 2026 · AutoSocial</p>

        <section className="space-y-8 text-gray-300 leading-relaxed">
          <div>
            <h2 className="text-xl font-semibold text-white mb-3">1. Who We Are</h2>
            <p>AutoSocial operates the Social Media Page Automation Tool, a private web admin panel used to generate, schedule and publish content to authorised Facebook Pages. This policy explains what data the Application processes and how it is protected.</p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-white mb-3">2. Data We Collect</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Facebook Page access tokens</strong> — stored encrypted (AES-256-GCM). Never logged or displayed.</li>
              <li><strong>Administrator account information</strong> — email address and hashed password (argon2id).</li>
              <li><strong>Generated post content</strong> — captions, headlines, hashtags and AI-generated images.</li>
              <li><strong>Publishing and audit logs</strong> — records of every approval, publishing attempt and schedule change.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-white mb-3">3. How We Use Your Data</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>To publish approved posts to your Facebook Page via the official Graph API.</li>
              <li>To manage the publishing schedule and audit trail.</li>
              <li>To authenticate the administrator and enforce role-based access control.</li>
            </ul>
            <p className="mt-3">We do not sell, rent or share your data with third parties beyond the services listed below.</p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-white mb-3">4. Third-Party Services</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Meta / Facebook Graph API</strong> — used to publish content. Governed by Meta Platform Terms.</li>
              <li><strong>Google Gemini API</strong> — used for AI text generation. Free-tier data use policy applies [VERIFY at ai.google.dev].</li>
              <li><strong>Cloudflare Workers AI</strong> — used for AI image generation [VERIFY at developers.cloudflare.com].</li>
              <li><strong>Neon / PostgreSQL</strong> — serverless database hosting for all stored records.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-white mb-3">5. Data Retention</h2>
            <p>Publishing attempts and audit logs are retained for a minimum of 12 months. Generated content is retained until archived by the administrator. Facebook access tokens are deleted immediately upon page disconnection.</p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-white mb-3">6. Security</h2>
            <p>All data is transmitted over HTTPS. Access tokens are encrypted at rest. Passwords are hashed using argon2id. Admin sessions use HttpOnly, Secure, SameSite cookies.</p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-white mb-3">7. Contact</h2>
            <p>For privacy enquiries or to exercise your data rights, please contact the AutoSocial administrator directly or use the <a href="/data-deletion" className="text-blue-400 underline">data deletion page</a>.</p>
          </div>
        </section>
      </div>
    </main>
  );
}
