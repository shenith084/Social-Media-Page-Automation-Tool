import type { ReactNode } from "react";
import { AdminSidebar } from "@/components/admin/sidebar";
import { DialogProvider } from "@/components/ui/dialog-provider";

export const dynamic = "force-dynamic";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <DialogProvider>
      <div className="admin-shell">
        <AdminSidebar />
        <main id="admin-main-content" className="admin-main-scroll">
          {children}
        </main>
      </div>
    </DialogProvider>
  );
}
