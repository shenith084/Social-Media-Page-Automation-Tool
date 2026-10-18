import { Metadata } from "next";
import { Users as UsersIcon, Shield, Check, X, ShieldAlert, UserCheck } from "lucide-react";
import { db } from "@/lib/db";
import { users, roles, userRoles, userPermissionGrants, permissions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const metadata: Metadata = { title: "Users & Permissions | Pixzora Social" };
export const dynamic = "force-dynamic";

export default async function UsersPage() {
  let allUsers: (typeof users.$inferSelect)[] = [];
  let allRoles: (typeof roles.$inferSelect)[] = [];
  let assignedRoles: { userId: string; roleName: string }[] = [];
  let approveGrantUserIds = new Set<string>();

  try {
    allUsers = await db.select().from(users);
    allRoles = await db.select().from(roles);
    assignedRoles = await db
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

    approveGrantUserIds = new Set(approveGrants.map((g) => g.userId));
  } catch (err) {
    console.warn("Could not load users/roles from DB:", err);
  }

  const roleByUserId = new Map<string, string>();
  for (const ur of assignedRoles) {
    roleByUserId.set(ur.userId, ur.roleName);
  }

  const activeCount = allUsers.filter((u) => u.isActive).length;

  return (
    <div className="admin-page-container">
      {/* Top Header Row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "26px",
          gap: "16px",
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "14px",
              background: "#EEF2FF",
              border: "1px solid #E0E7FF",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 1px 2px rgba(99,102,241,0.06)",
              flexShrink: 0,
            }}
          >
            <UsersIcon size={24} style={{ color: "#6366F1" }} />
          </div>
          <div>
            <h1
              style={{
                fontSize: "1.625rem",
                fontWeight: 700,
                color: "#0F172A",
                letterSpacing: "-0.025em",
                margin: 0,
              }}
            >
              Users & Permissions
            </h1>
            <p
              style={{
                fontSize: "0.875rem",
                color: "#64748B",
                margin: "3px 0 0 0",
              }}
            >
              Role-Based Access Control (RBAC) management and publishing queue authorization.
            </p>
          </div>
        </div>

        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            background: "#FFFFFF",
            border: "1px solid #E2E8F0",
            borderRadius: "12px",
            padding: "8px 16px",
            boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
          }}
        >
          <UserCheck size={16} style={{ color: "#10B981" }} />
          <span style={{ fontSize: "0.8125rem", color: "#64748B", fontWeight: 500 }}>
            Active Accounts:{" "}
            <strong style={{ color: "#0F172A", fontWeight: 700 }}>
              {activeCount} of {allUsers.length}
            </strong>
          </span>
        </div>
      </div>

      {/* Users table card */}
      <div
        style={{
          background: "#FFFFFF",
          borderRadius: "16px",
          border: "1px solid #E2E8F0",
          boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
          overflow: "hidden",
          marginBottom: "24px",
        }}
      >
        <div
          style={{
            padding: "18px 24px",
            borderBottom: "1px solid #F1F5F9",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <div style={{ fontSize: "0.9375rem", fontWeight: 700, color: "#0F172A" }}>
              Team Members
            </div>
            <div style={{ fontSize: "0.8125rem", color: "#64748B", marginTop: "2px" }}>
              Directory of registered staff members and their system permissions
            </div>
          </div>
          <span
            style={{
              padding: "4px 10px",
              background: "#F1F5F9",
              color: "#475569",
              borderRadius: "9999px",
              fontSize: "0.75rem",
              fontWeight: 600,
            }}
          >
            {allUsers.length} {allUsers.length === 1 ? "Member" : "Members"}
          </span>
        </div>

        {allUsers.length === 0 ? (
          <div style={{ padding: "48px 24px", textAlign: "center", color: "#64748B", fontSize: "0.875rem" }}>
            No registered users found in the system database.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                textAlign: "left",
                fontSize: "0.875rem",
              }}
            >
              <thead>
                <tr
                  style={{
                    background: "#F8FAFC",
                    borderBottom: "1px solid #E2E8F0",
                  }}
                >
                  <th
                    style={{
                      padding: "12px 24px",
                      color: "#475569",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    User
                  </th>
                  <th
                    style={{
                      padding: "12px 24px",
                      color: "#475569",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    Role
                  </th>
                  <th
                    style={{
                      padding: "12px 24px",
                      color: "#475569",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    Queue Approval Permission
                  </th>
                  <th
                    style={{
                      padding: "12px 24px",
                      color: "#475569",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {allUsers.map((u) => {
                  const roleName = roleByUserId.get(u.id) || "Editor";
                  const isAdmin = roleName.toLowerCase().includes("admin");
                  const hasApproveGrant = isAdmin || approveGrantUserIds.has(u.id);

                  // User initial
                  const initial = (u.name || u.email || "U").charAt(0).toUpperCase();

                  return (
                    <tr
                      key={u.id}
                      style={{
                        borderBottom: "1px solid #F1F5F9",
                        transition: "background 0.15s ease",
                      }}
                    >
                      <td style={{ padding: "16px 24px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          <div
                            style={{
                              width: "36px",
                              height: "36px",
                              borderRadius: "10px",
                              background: isAdmin
                                ? "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)"
                                : "linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "#FFFFFF",
                              fontWeight: 700,
                              fontSize: "0.875rem",
                              flexShrink: 0,
                            }}
                          >
                            {initial}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: "#0F172A" }}>{u.name}</div>
                            <div style={{ fontSize: "0.75rem", color: "#64748B" }}>{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "16px 24px" }}>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px",
                            padding: "4px 10px",
                            borderRadius: "9999px",
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            background: isAdmin ? "#F5F3FF" : "#EFF6FF",
                            color: isAdmin ? "#6D28D9" : "#1D4ED8",
                            border: `1px solid ${isAdmin ? "#DDD6FE" : "#BFDBFE"}`,
                          }}
                        >
                          <Shield size={12} />
                          {roleName}
                        </span>
                      </td>
                      <td style={{ padding: "16px 24px" }}>
                        {hasApproveGrant ? (
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "6px",
                              padding: "4px 10px",
                              borderRadius: "6px",
                              background: "#F0FDF4",
                              color: "#15803D",
                              border: "1px solid #BBF7D0",
                              fontSize: "0.8125rem",
                              fontWeight: 500,
                            }}
                          >
                            <Check size={14} style={{ color: "#16A34A" }} />
                            Permitted {isAdmin ? "(Role Default)" : "(Explicit Grant)"}
                          </span>
                        ) : (
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "6px",
                              padding: "4px 10px",
                              borderRadius: "6px",
                              background: "#F8FAFC",
                              color: "#64748B",
                              border: "1px solid #E2E8F0",
                              fontSize: "0.8125rem",
                              fontWeight: 500,
                            }}
                          >
                            <X size={14} style={{ color: "#94A3B8" }} />
                            Drafts Only (No Approval Access)
                          </span>
                        )}
                      </td>
                      <td style={{ padding: "16px 24px" }}>
                        {u.isActive ? (
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "6px",
                              padding: "3px 10px",
                              borderRadius: "9999px",
                              background: "#ECFDF5",
                              color: "#047857",
                              border: "1px solid #A7F3D0",
                              fontSize: "0.75rem",
                              fontWeight: 600,
                            }}
                          >
                            <span
                              style={{
                                width: "6px",
                                height: "6px",
                                borderRadius: "50%",
                                background: "#10B981",
                              }}
                            />
                            Active
                          </span>
                        ) : (
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "6px",
                              padding: "3px 10px",
                              borderRadius: "9999px",
                              background: "#FEF2F2",
                              color: "#B91C1C",
                              border: "1px solid #FECACA",
                              fontSize: "0.75rem",
                              fontWeight: 600,
                            }}
                          >
                            <span
                              style={{
                                width: "6px",
                                height: "6px",
                                borderRadius: "50%",
                                background: "#EF4444",
                              }}
                            />
                            Disabled
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* RBAC Security Note */}
      <div
        style={{
          background: "#FFFBEB",
          borderRadius: "14px",
          border: "1px solid #FEF3C7",
          padding: "16px 20px",
          display: "flex",
          gap: "14px",
          alignItems: "flex-start",
        }}
      >
        <ShieldAlert size={20} style={{ color: "#D97706", flexShrink: 0, marginTop: "2px" }} />
        <div style={{ fontSize: "0.8125rem", color: "#78350F", lineHeight: 1.5 }}>
          <strong style={{ color: "#92400E" }}>Security & Integrity Rule (Section 9):</strong> All permission checks are strictly validated on the server middleware and API endpoints. Adding posts to the publishing queue is guarded by the{" "}
          <code
            style={{
              background: "#FEF3C7",
              color: "#92400E",
              padding: "2px 6px",
              borderRadius: "4px",
              fontSize: "0.75rem",
              fontWeight: 600,
              border: "1px solid #FDE68A",
            }}
          >
            queue.approve
          </code>{" "}
          permission. Editors can draft and iterate on content freely, but only authorized members can queue content for automated publishing.
        </div>
      </div>
    </div>
  );
}

