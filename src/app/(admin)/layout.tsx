import type { ReactNode } from "react";
import { AdminSidebar } from "@/components/admin/sidebar";

export const dynamic = "force-dynamic";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="layout-admin">
      <AdminSidebar />
      <main
        id="admin-main-content"
        style={{
          minHeight: "100dvh",
          background: "rgb(9, 9, 18)",
          overflowY: "auto",
        }}
      >
        {children}
      </main>
    </div>
  );
}
