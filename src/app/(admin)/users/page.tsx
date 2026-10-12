import { Metadata } from "next";
import { Users as UsersIcon, Shield, Check, X, ShieldAlert } from "lucide-react";
import { db } from "@/lib/db";
import { users, roles, userRoles, userPermissionGrants, permissions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const metadata: Metadata = { title: "Users & Permissions" };
export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const allUsers = await db.select().from(users);
  const allRoles = await db.select().from(roles);
  const assignedRoles = await db
    .select({
      userId: userRoles.userId,
      roleName: roles.name,
    })
    .from(userRoles)
    .innerJoin(roles, eq(userRoles.roleId, roles.id));

  // Find queue.approve grants
  const queueApprovePerm = (
    await db.select().from(permissions).where(eq(permissions.name, "queue.approve"))
  )[0];

  const approveGrants = queueApprovePerm
    ? await db
        .select()
        .from(userPermissionGrants)
        .where(eq(userPermissionGrants.permissionId, queueApprovePerm.id))
    : [];

  const approveGrantUserIds = new Set(approveGrants.map((g) => g.userId));

  const roleByUserId = new Map<string, string>();
  for (const ur of assignedRoles) {
    roleByUserId.set(ur.userId, ur.roleName);
  }

  return (
    <div style={{ padding: "32px", maxWidth: "1000px" }} className="animate-fade-in">
      <div style={{ marginBottom: "28px" }}>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 700, marginBottom: "4px", display: "flex", alignItems: "center", gap: "10px" }}>
          <UsersIcon size={26} style={{ color: "rgb(139,92,246)" }} />
          Users & Permissions
        </h1>
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.875rem" }}>
          Role-Based Access Control (RBAC) management. Content Editors require explicit grant for publishing queue approvals.
        </p>
      </div>

      {/* Users table */}
      <div className="glass-card-elevated" style={{ overflow: "hidden", marginBottom: "32px" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.08)", fontWeight: 600 }}>
          Team Members ({allUsers.length})
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.875rem" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)" }}>
              <th style={{ padding: "12px 20px", color: "rgba(255,255,255,0.5)", fontWeight: 500 }}>User</th>
              <th style={{ padding: "12px 20px", color: "rgba(255,255,255,0.5)", fontWeight: 500 }}>Role</th>
              <th style={{ padding: "12px 20px", color: "rgba(255,255,255,0.5)", fontWeight: 500 }}>Queue Approval Permission</th>
              <th style={{ padding: "12px 20px", color: "rgba(255,255,255,0.5)", fontWeight: 500 }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {allUsers.map((u) => {
              const roleName = roleByUserId.get(u.id) || "Editor";
              const isAdmin = roleName.toLowerCase().includes("admin");
              const hasApproveGrant = isAdmin || approveGrantUserIds.has(u.id);

              return (
                <tr key={u.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                  <td style={{ padding: "14px 20px" }}>
                    <div style={{ fontWeight: 600 }}>{u.name}</div>
                    <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)" }}>{u.email}</div>
                  </td>
                  <td style={{ padding: "14px 20px" }}>
                    <span
                      style={{
                        padding: "4px 8px",
                        borderRadius: "4px",
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        background: isAdmin ? "rgba(139,92,246,0.15)" : "rgba(59,130,246,0.15)",
                        color: isAdmin ? "rgb(196,181,253)" : "rgb(147,197,253)",
                      }}
                    >
                      {roleName}
                    </span>
                  </td>
                  <td style={{ padding: "14px 20px" }}>
                    {hasApproveGrant ? (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "rgb(134,239,172)", fontSize: "0.8125rem" }}>
                        <Check size={14} /> Permitted {isAdmin ? "(Role Default)" : "(Explicit Grant)"}
                      </span>
                    ) : (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "rgba(255,255,255,0.4)", fontSize: "0.8125rem" }}>
                        <X size={14} /> Drafts Only (No Approval Access)
                      </span>
                    )}
                  </td>
                  <td style={{ padding: "14px 20px" }}>
                    <span className="badge badge-approved" style={{ fontSize: "0.75rem" }}>
                      {u.isActive ? "Active" : "Disabled"}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* RBAC Security Note */}
      <div className="glass-card" style={{ padding: "18px 20px", display: "flex", gap: "14px", alignItems: "flex-start" }}>
        <ShieldAlert size={20} style={{ color: "rgb(234,179,8)", flexShrink: 0, marginTop: "2px" }} />
        <div style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,0.6)" }}>
          <strong style={{ color: "#fff" }}>Security & Integrity Rule (Section 9):</strong> All permission checks are strictly validated on the server middleware and API endpoints. Adding posts to the publishing queue is guarded by the <code style={{ color: "rgb(196,181,253)" }}>queue.approve</code> permission.
        </div>
      </div>
    </div>
  );
}
