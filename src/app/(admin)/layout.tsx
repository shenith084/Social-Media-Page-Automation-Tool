import type { ReactNode } from "react";
import { AdminSidebar } from "@/components/admin/sidebar";
import { DialogProvider } from "@/components/ui/dialog-provider";
import { getCurrentUserSession } from "@/lib/rbac-server";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const currentUser = await getCurrentUserSession();

  return (
    <DialogProvider>
      <div className="admin-shell">
        <AdminSidebar
          currentUser={
            currentUser
              ? {
                  id: currentUser.id,
                  name: currentUser.name,
                  email: currentUser.email,
                  role: currentUser.role,
                  isSuperAdmin: currentUser.isSuperAdmin,
                  isAdmin: currentUser.isAdmin,
                  isEditor: currentUser.isEditor,
                  isViewer: currentUser.isViewer,
                  permissions: currentUser.permissions,
                }
              : null
          }
        />
        <main id="admin-main-content" className="admin-main-scroll">
          {children}
        </main>
      </div>
    </DialogProvider>
  );
}
