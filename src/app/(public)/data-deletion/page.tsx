import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Data Deletion — Pixzora Social Automation",
  description: "Request deletion of your data from the Pixzora Social Media Automation Tool.",
  robots: { index: false, follow: false },
};

export default function DataDeletionPage() {
  return (
    <main className="min-h-screen bg-gray-950 text-gray-100 py-16 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-2 text-white">Data Deletion Request</h1>
        <p className="text-gray-400 text-sm mb-10">Pixzora Labs · Social Media Page Automation Tool</p>

        <section className="space-y-8 text-gray-300 leading-relaxed">
          <div>
            <h2 className="text-xl font-semibold text-white mb-3">How to Delete Your Data</h2>
            <p>If you have used the Pixzora Social Media Automation Tool with your Facebook account and wish to have all associated data removed, follow the steps below.</p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-white mb-3">Step 1 — Revoke App Access via Facebook</h2>
            <ol className="list-decimal pl-5 space-y-2">
              <li>Go to Facebook Settings &rarr; Apps and Websites.</li>
              <li>Find &quot;Pixzora Social Automation&quot; in the list.</li>
              <li>Click <strong>Remove</strong> to revoke app access.</li>
            </ol>
            <p className="mt-3 text-sm text-gray-400">This immediately invalidates the Facebook Page access token stored by the Application. The system will detect the revocation at the next health check and pause the connected Page automatically.</p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-white mb-3">Step 2 — Request Complete Data Removal</h2>
            <p>To request deletion of all remaining stored data (audit logs, generated content, publishing history, user account), please contact the application administrator. Upon receipt, we will:</p>
            <ul className="list-disc pl-5 space-y-2 mt-3">
              <li>Delete the encrypted Page access token immediately.</li>
              <li>Remove all generated posts, captions, headlines and image assets.</li>
              <li>Delete the administrator account and all session records.</li>
              <li>Purge audit logs and usage records associated with the account.</li>
              <li>Confirm deletion in writing within 30 days.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-white mb-3">What We Cannot Delete</h2>
            <p>Posts that have already been published to your Facebook Page exist on Facebook&apos;s servers. You can delete those directly from your Facebook Page. We cannot delete published posts via the API in the current release.</p>
          </div>

          <div className="border border-gray-700 rounded-lg p-6 bg-gray-900">
            <h2 className="text-lg font-semibold text-white mb-2">Confirmation</h2>
            <p className="text-gray-300 text-sm">After completing Step 1 above, your Facebook access token is automatically invalidated. Your data deletion request will be processed within <strong>30 days</strong>. You will receive written confirmation once the deletion is complete.</p>
          </div>
        </section>
      </div>
    </main>
  );
}
