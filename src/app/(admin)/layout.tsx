import type { ReactNode } from "react";
import { AdminSidebar } from "@/components/admin/sidebar";

export const dynamic = "force-dynamic";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div
      className="layout-admin"
      style={{
        display: "flex",
        height: "100vh",
        maxHeight: "100vh",
        overflow: "hidden",
        background: "#F8FAFC",
      }}
    >
      <AdminSidebar />
      <main
        id="admin-main-content"
        style={{
          flex: 1,
          height: "100vh",
          overflowY: "auto",
          overflowX: "hidden",
          background: "radial-gradient(1100px 520px at 15% 0%, #DBEAFE 0%, #EDF3FE 35%, #F8FAFC 70%)",
        }}
      >
        {children}
      </main>
    </div>
  );
}
