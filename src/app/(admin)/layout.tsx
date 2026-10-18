import type { ReactNode } from "react";
import { AdminSidebar } from "@/components/admin/sidebar";

export const dynamic = "force-dynamic";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="admin-shell">
      <AdminSidebar />
      <main id="admin-main-content" className="admin-main-scroll">
        {children}
      </main>
    </div>
  );
}
