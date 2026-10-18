"use client";

import { useState, useTransition, useMemo } from "react";
import {
  Users as UsersIcon,
  Shield,
  Check,
  X,
  Plus,
  KeyRound,
  Trash2,
  Lock,
  Mail,
  User as UserIcon,
  Search,
  CheckSquare,
  Square,
  Sparkles,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import {
  createUserAction,
  updateUserPermissionsAction,
  updateUserRoleAction,
  toggleUserStatusAction,
  deleteUserAction,
} from "@/app/actions/user-manage";

export interface UserRow {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  roleName: string;
  permissions: string[];
}

export interface PermissionDef {
  name: string;
  description: string;
  category: "Content & Generation" | "Publishing Queue" | "Page & Schedule" | "Templates & AI" | "Recovery & Ops" | "Administration";
  isCritical?: boolean;
}

const ALL_PERMISSIONS: PermissionDef[] = [
  { name: "generation.run", description: "Generate AI social media content and headlines", category: "Content & Generation" },
  { name: "draft.create", description: "Create new social media drafts", category: "Content & Generation" },
  { name: "draft.edit", description: "Edit draft captions, headlines, and visuals", category: "Content & Generation" },
  { name: "draft.regenerate", description: "Regenerate draft visuals and captions", category: "Content & Generation" },
  { name: "draft.archive", description: "Archive or delete drafts from the library", category: "Content & Generation" },
  { name: "queue.approve", description: "Approve drafts and schedule into publishing queue (Publishing Gate)", category: "Publishing Queue", isCritical: true },
  { name: "queue.reorder", description: "Reorder publishing priority in the queue", category: "Publishing Queue" },
  { name: "queue.pause", description: "Pause and resume publishing queue dispatch", category: "Publishing Queue" },
  { name: "queue.remove", description: "Remove or cancel queued publishing items", category: "Publishing Queue" },
  { name: "schedule.edit", description: "Modify posting slots, intervals, and active hours", category: "Page & Schedule" },
  { name: "page.connect", description: "Manage Facebook Page connection and tokens", category: "Page & Schedule" },
  { name: "templates.edit", description: "Edit branded image templates and styling", category: "Templates & AI" },
  { name: "aiSettings.edit", description: "Configure Gemini AI text and image settings", category: "Templates & AI" },
  { name: "recovery.manage", description: "Retry, reconcile, and resolve stuck jobs", category: "Recovery & Ops" },
  { name: "users.manage", description: "Create system users and manage permissions", category: "Administration", isCritical: true },
  { name: "audit.view", description: "View audit trails, system logs, and security events", category: "Administration" },
];

const DEFAULT_ROLE_PERMS: Record<string, string[]> = {
  super_admin: ALL_PERMISSIONS.map((p) => p.name),
  admin: ALL_PERMISSIONS.filter((p) => p.name !== "users.manage").map((p) => p.name),
  editor: ["generation.run", "draft.create", "draft.edit", "draft.regenerate", "draft.archive", "audit.view"],
  viewer: ["audit.view"],
};

interface Props {
  initialUsers: UserRow[];
}

export function UsersClient({ initialUsers }: Props) {
  const [usersList, setUsersList] = useState<UserRow[]>(initialUsers);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  // Create User Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createEmail, setCreateEmail] = useState("");
  const [createPassword, setCreatePassword] = useState("Pixzora2026!");
  const [createRole, setCreateRole] = useState("admin");
  const [createPerms, setCreatePerms] = useState<string[]>(DEFAULT_ROLE_PERMS["admin"] || []);

  // Manage Permissions Modal State
  const [permModalUser, setPermModalUser] = useState<UserRow | null>(null);
  const [selectedPerms, setSelectedPerms] = useState<string[]>([]);
  const [permSearch, setPermSearch] = useState("");

  const [toast, setToast] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  const filteredUsers = useMemo(() => {
    return usersList.filter((u) => {
      const matchSearch =
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase());
      const matchRole = roleFilter === "all" || u.roleName.toLowerCase() === roleFilter.toLowerCase();
      return matchSearch && matchRole;
    });
  }, [usersList, search, roleFilter]);

  const handleOpenCreate = () => {
    setCreateName("");
    setCreateEmail("");
    setCreatePassword("Pixzora2026!");
    setCreateRole("admin");
    setCreatePerms(DEFAULT_ROLE_PERMS["admin"] || []);
    setIsCreateOpen(true);
  };

  const handleCreateRoleChange = (role: string) => {
    setCreateRole(role);
    setCreatePerms(DEFAULT_ROLE_PERMS[role] || []);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!createEmail.includes("@") || !createName.trim()) {
      alert("Please provide a valid name and email address.");
      return;
    }

    startTransition(async () => {
      const res = await createUserAction({
        name: createName,
        email: createEmail,
        password: createPassword,
        roleName: createRole,
        permissionNames: createPerms,
        isActive: true,
      });

      if (res.success && res.userId) {
        setUsersList((prev) => [
          ...prev,
          {
            id: res.userId!,
            name: createName,
            email: createEmail.toLowerCase(),
            isActive: true,
            roleName: createRole,
            permissions: createPerms,
          },
        ]);
        setIsCreateOpen(false);
        showToast(`User ${createName} created successfully as ${createRole.replace('_', ' ')}.`);
      } else {
        alert(res.error || "Failed to create user.");
      }
    });
  };

  const handleOpenPermissions = (u: UserRow) => {
    setPermModalUser(u);
    const isSuper = u.roleName.toLowerCase().includes("super_admin");
    const perms = isSuper && u.permissions.length === 0 ? ALL_PERMISSIONS.map((p) => p.name) : u.permissions;
    setSelectedPerms(perms);
    setPermSearch("");
  };

  const handleTogglePerm = (permName: string) => {
    setSelectedPerms((prev) =>
      prev.includes(permName) ? prev.filter((p) => p !== permName) : [...prev, permName]
    );
  };

  const handleSavePermissions = () => {
    if (!permModalUser) return;
    const targetUserId = permModalUser.id;
    const newPerms = selectedPerms;

    startTransition(async () => {
      const res = await updateUserPermissionsAction({
        userId: targetUserId,
        permissionNames: newPerms,
      });

      if (res.success) {
        setUsersList((prev) =>
          prev.map((u) => (u.id === targetUserId ? { ...u, permissions: newPerms } : u))
        );
        setPermModalUser(null);
        showToast(`Permissions updated successfully for ${permModalUser.name}.`);
      } else {
        alert(res.error || "Failed to update permissions.");
      }
    });
  };

  const handleToggleStatus = (u: UserRow) => {
    const nextStatus = !u.isActive;
    startTransition(async () => {
      const res = await toggleUserStatusAction({ userId: u.id, isActive: nextStatus });
      if (res.success) {
        setUsersList((prev) =>
          prev.map((item) => (item.id === u.id ? { ...item, isActive: nextStatus } : item))
        );
        showToast(`${u.name}'s status set to ${nextStatus ? "Active" : "Disabled"}.`);
      }
    });
  };

  const handleDeleteUser = (u: UserRow) => {
    if (!confirm(`Are you sure you want to remove user "${u.name}" (${u.email})?`)) return;

    startTransition(async () => {
      const res = await deleteUserAction(u.id);
      if (res.success) {
        setUsersList((prev) => prev.filter((item) => item.id !== u.id));
        showToast(`User ${u.name} has been removed.`);
      } else {
        alert(res.error || "Could not delete user.");
      }
    });
  };

  const categories = useMemo(() => {
    const cats: Record<string, PermissionDef[]> = {};
    for (const p of ALL_PERMISSIONS) {
      if (
        permSearch.trim() &&
        !p.name.toLowerCase().includes(permSearch.toLowerCase()) &&
        !p.description.toLowerCase().includes(permSearch.toLowerCase())
      ) {
        continue;
      }
      if (!cats[p.category]) cats[p.category] = [];
      cats[p.category].push(p);
    }
    return cats;
  }, [permSearch]);

  const activeCount = usersList.filter((u) => u.isActive).length;
  const approversCount = usersList.filter(
    (u) => u.roleName.toLowerCase().includes("admin") || u.permissions.includes("queue.approve")
  ).length;
  return (
    <div>
      {/* Toast Notification */}
      {toast && (
        <div
          style={{
            position: "fixed",
            bottom: "28px",
            right: "28px",
            background: "#0F172A",
            color: "#FFFFFF",
            padding: "12px 20px",
            borderRadius: "12px",
            fontSize: "0.875rem",
            fontWeight: 500,
            boxShadow: "0 10px 25px -5px rgba(0,0,0,0.3)",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            zIndex: 100,
          }}
        >
          <CheckCircle2 size={18} style={{ color: "#10B981" }} />
          <span>{toast}</span>
        </div>
      )}

      {/* Top Header Row */}
      <div
        className="admin-page-header"
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
              background: "#EDE9FE",
              border: "1px solid #DDD6FE",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 1px 2px rgba(99,102,241,0.06)",
              flexShrink: 0,
            }}
          >
            <Shield size={24} style={{ color: "#6366F1" }} strokeWidth={2.2} />
          </div>
          <div>
            <h1
              style={{
                fontSize: "1.625rem",
                fontWeight: 700,
                color: "#0F172A",
                letterSpacing: "-0.025em",
                margin: 0,
                lineHeight: 1.2,
              }}
            >
              Users & Permissions
            </h1>
            <p style={{ fontSize: "0.875rem", color: "#64748B", margin: "4px 0 0", fontWeight: 400 }}>
              Super Admin RBAC management, member creation, and granular checkbox permissions.
            </p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              background: "#FFFFFF",
              border: "1px solid #E2E8F0",
              borderRadius: "10px",
              padding: "8px 14px",
              fontSize: "0.8125rem",
              color: "#64748B",
              boxShadow: "0 1px 2px rgba(0,0,0,0.02)",
            }}
          >
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#10B981" }} />
            <span>
              Active Accounts: <strong style={{ color: "#0F172A" }}>{activeCount} of {usersList.length}</strong>
            </span>
          </div>

          <button
            id="btn-create-user"
            onClick={handleOpenCreate}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 20px",
              background: "#4F46E5",
              borderRadius: "10px",
              color: "white",
              fontSize: "0.875rem",
              fontWeight: 600,
              border: "none",
              cursor: "pointer",
              boxShadow: "0 2px 8px rgba(79, 70, 229, 0.35)",
              transition: "all 0.15s ease",
            }}
          >
            <Plus size={16} strokeWidth={2.5} />
            Create User
          </button>
        </div>
      </div>

      {/* Overview Cards Row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "16px",
          marginBottom: "24px",
        }}
      >
        <div style={{ background: "#FFFFFF", borderRadius: "14px", border: "1px solid #E2E8F0", padding: "18px 20px" }}>
          <div style={{ fontSize: "0.8125rem", color: "#64748B", fontWeight: 500 }}>Total Team Members</div>
          <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "#0F172A", marginTop: "4px" }}>{usersList.length}</div>
          <div style={{ fontSize: "0.75rem", color: "#10B981", marginTop: "4px" }}>Registered system accounts</div>
        </div>

        <div style={{ background: "#FFFFFF", borderRadius: "14px", border: "1px solid #E2E8F0", padding: "18px 20px" }}>
          <div style={{ fontSize: "0.8125rem", color: "#64748B", fontWeight: 500 }}>Super Administrators</div>
          <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "#6366F1", marginTop: "4px" }}>
            {usersList.filter((u) => u.roleName.toLowerCase().includes("super_admin")).length}
          </div>
          <div style={{ fontSize: "0.75rem", color: "#6366F1", marginTop: "4px" }}>Full system control & user management</div>
        </div>

        <div style={{ background: "#FFFFFF", borderRadius: "14px", border: "1px solid #E2E8F0", padding: "18px 20px" }}>
          <div style={{ fontSize: "0.8125rem", color: "#64748B", fontWeight: 500 }}>Queue Approvers (Gate)</div>
          <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "#0284C7", marginTop: "4px" }}>{approversCount}</div>
          <div style={{ fontSize: "0.75rem", color: "#0284C7", marginTop: "4px" }}>Granted queue.approve permission</div>
        </div>

        <div style={{ background: "#FFFFFF", borderRadius: "14px", border: "1px solid #E2E8F0", padding: "18px 20px" }}>
          <div style={{ fontSize: "0.8125rem", color: "#64748B", fontWeight: 500 }}>Granular Permissions</div>
          <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "#10B981", marginTop: "4px" }}>16 Modules</div>
          <div style={{ fontSize: "0.75rem", color: "#10B981", marginTop: "4px" }}>Individual checkbox selectable</div>
        </div>
      </div>

      {/* Main Table Card */}
      <div style={{ background: "#FFFFFF", borderRadius: "16px", border: "1px solid #E2E8F0", boxShadow: "0 1px 3px rgba(0,0,0,0.03)", overflow: "hidden" }}>
        {/* Filter bar */}
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #E2E8F0", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "14px", flexWrap: "wrap", background: "#FAFAFA" }}>
          <div style={{ position: "relative", minWidth: "260px" }}>
            <Search size={15} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#94A3B8" }} />
            <input
              type="text"
              placeholder="Search members by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: "100%", padding: "8px 12px 8px 36px", borderRadius: "10px", border: "1px solid #E2E8F0", fontSize: "0.875rem", color: "#0F172A", outline: "none", background: "#FFFFFF" }}
            />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "0.8125rem", color: "#64748B", fontWeight: 500 }}>Filter Role:</span>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              style={{ padding: "8px 12px", borderRadius: "10px", border: "1px solid #E2E8F0", fontSize: "0.8125rem", color: "#0F172A", background: "#FFFFFF", cursor: "pointer", outline: "none" }}
            >
              <option value="all">All Roles</option>
              <option value="super_admin">Super Admin</option>
              <option value="admin">Admin</option>
              <option value="editor">Editor</option>
              <option value="viewer">Viewer</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="table-responsive-container">
          <table id="users-table" style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }} role="table" aria-label="Users directory">
            <thead>
              <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
                <th style={{ padding: "14px 20px", fontSize: "0.75rem", fontWeight: 700, color: "#64748B", letterSpacing: "0.06em", textTransform: "uppercase" }}>USER</th>
                <th style={{ padding: "14px 20px", fontSize: "0.75rem", fontWeight: 700, color: "#64748B", letterSpacing: "0.06em", textTransform: "uppercase", width: "160px" }}>SYSTEM ROLE</th>
                <th style={{ padding: "14px 20px", fontSize: "0.75rem", fontWeight: 700, color: "#64748B", letterSpacing: "0.06em", textTransform: "uppercase" }}>PERMISSIONS & QUEUE GATE</th>
                <th style={{ padding: "14px 20px", fontSize: "0.75rem", fontWeight: 700, color: "#64748B", letterSpacing: "0.06em", textTransform: "uppercase", width: "110px" }}>STATUS</th>
                <th style={{ padding: "14px 20px", textAlign: "right", fontSize: "0.75rem", fontWeight: 700, color: "#64748B", letterSpacing: "0.06em", textTransform: "uppercase", width: "200px" }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: "48px 24px", textAlign: "center", color: "#64748B" }}>No users match your criteria.</td>
                </tr>
              ) : (
                filteredUsers.map((u, idx) => {
                  const isSuper = u.roleName.toLowerCase().includes("super_admin");
                  const isAdmin = u.roleName.toLowerCase().includes("admin");
                  const hasApproveGrant = isSuper || isAdmin || u.permissions.includes("queue.approve");
                  const permCount = isSuper ? ALL_PERMISSIONS.length : u.permissions.length;
                  const initial = (u.name || u.email || "U").charAt(0).toUpperCase();

                  return (
                    <tr key={u.id} id={`user-row-${u.id}`} style={{ borderBottom: idx < filteredUsers.length - 1 ? "1px solid #F1F5F9" : "none" }}>
                      <td style={{ padding: "16px 20px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          <div style={{ width: "40px", height: "40px", borderRadius: "12px", background: isSuper ? "linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)" : isAdmin ? "linear-gradient(135deg, #0284C7 0%, #38BDF8 100%)" : "linear-gradient(135deg, #64748B 0%, #94A3B8 100%)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, fontSize: "0.9375rem", flexShrink: 0 }}>
                            {initial}
                          </div>
                          <div>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                              <span style={{ fontWeight: 700, fontSize: "0.9375rem", color: "#0F172A" }}>{u.name}</span>
                              {u.email === "shenith222@gmail.com" && (
                                <span style={{ fontSize: "0.6875rem", padding: "2px 6px", background: "#EDE9FE", color: "#6D28D9", borderRadius: "4px", fontWeight: 700 }}>YOU</span>
                              )}
                            </div>
                            <div style={{ fontSize: "0.8125rem", color: "#64748B", marginTop: "2px" }}>{u.email}</div>
                          </div>
                        </div>
                      </td>

                      <td style={{ padding: "16px 20px", whiteSpace: "nowrap" }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", padding: "4px 10px", borderRadius: "9999px", fontSize: "0.75rem", fontWeight: 600, background: isSuper ? "#EDE9FE" : isAdmin ? "#E0F2FE" : "#F1F5F9", color: isSuper ? "#6D28D9" : isAdmin ? "#0369A1" : "#475569", border: `1px solid ${isSuper ? "#DDD6FE" : isAdmin ? "#BAE6FD" : "#E2E8F0"}` }}>
                          <Shield size={12} />
                          {isSuper ? "Super Admin" : isAdmin ? "Admin" : u.roleName}
                        </span>
                      </td>

                      <td style={{ padding: "16px 20px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                          <span style={{ padding: "3px 8px", borderRadius: "6px", background: "#F8FAFC", border: "1px solid #E2E8F0", fontSize: "0.75rem", color: "#334155", fontWeight: 600 }}>
                            {permCount} {permCount === 1 ? "Grant" : "Grants"}
                          </span>

                          {hasApproveGrant ? (
                            <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "3px 8px", borderRadius: "6px", background: "#ECFDF5", color: "#065F46", border: "1px solid #A7F3D0", fontSize: "0.75rem", fontWeight: 600 }}>
                              <Check size={12} style={{ color: "#10B981" }} />
                              Queue Approver
                            </span>
                          ) : (
                            <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "3px 8px", borderRadius: "6px", background: "#F1F5F9", color: "#64748B", border: "1px solid #E2E8F0", fontSize: "0.75rem", fontWeight: 500 }}>
                              <X size={12} style={{ color: "#94A3B8" }} />
                              Drafts Only
                            </span>
                          )}
                        </div>
                      </td>

                      <td style={{ padding: "16px 20px", whiteSpace: "nowrap" }}>
                        <button
                          onClick={() => handleToggleStatus(u)}
                          title="Click to toggle status"
                          style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "4px 10px", borderRadius: "9999px", fontSize: "0.75rem", fontWeight: 600, background: u.isActive ? "#ECFDF5" : "#FEF2F2", color: u.isActive ? "#065F46" : "#991B1B", border: `1px solid ${u.isActive ? "#A7F3D0" : "#FECACA"}`, cursor: "pointer" }}
                        >
                          <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: u.isActive ? "#10B981" : "#EF4444" }} />
                          {u.isActive ? "Active" : "Disabled"}
                        </button>
                      </td>

                      <td style={{ padding: "16px 20px", textAlign: "right", whiteSpace: "nowrap" }}>
                        <div style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                          <button
                            id={`btn-manage-perms-${u.id}`}
                            onClick={() => handleOpenPermissions(u)}
                            title="Manage granular permissions (checkboxes)"
                            style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "6px 12px", background: "#EDE9FE", border: "1px solid #DDD6FE", borderRadius: "8px", color: "#6D28D9", fontSize: "0.8125rem", fontWeight: 600, cursor: "pointer" }}
                          >
                            <KeyRound size={14} />
                            Permissions
                          </button>

                          {u.email !== "shenith222@gmail.com" && (
                            <button
                              id={`btn-delete-user-${u.id}`}
                              onClick={() => handleDeleteUser(u)}
                              title="Delete user account"
                              style={{ width: "32px", height: "32px", borderRadius: "8px", background: "#FEF2F2", border: "1px solid #FECACA", color: "#DC2626", display: "inline-flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Security Rule Banner */}
      <div
        style={{
          marginTop: "20px",
          background: "#FFFBEB",
          borderRadius: "14px",
          border: "1px solid #FEF3C7",
          padding: "16px 20px",
          display: "flex",
          gap: "14px",
          alignItems: "flex-start",
        }}
      >
        <Shield size={20} style={{ color: "#D97706", flexShrink: 0, marginTop: "2px" }} />
        <div style={{ fontSize: "0.8125rem", color: "#78350F", lineHeight: 1.5 }}>
          <strong style={{ color: "#92400E" }}>Super Admin Governance (Section 9):</strong> Super
          Administrators can create system administrators, editors, and auditors. Permission checkboxes
          directly update the <code>user_permission_grants</code> database table. Content approval into
          the publishing queue is strictly enforced on the server by the{" "}
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
          permission gate.
        </div>
      </div>

      {/* CREATE NEW USER MODAL */}
      {isCreateOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.55)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "20px",
          }}
          onClick={() => setIsCreateOpen(false)}
        >
          <div
            style={{
              background: "#FFFFFF",
              borderRadius: "20px",
              width: "100%",
              maxWidth: "560px",
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
              border: "1px solid #E2E8F0",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                padding: "24px 28px",
                borderBottom: "1px solid #F1F5F9",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div
                  style={{
                    width: "42px",
                    height: "42px",
                    borderRadius: "12px",
                    background: "#EDE9FE",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#6366F1",
                  }}
                >
                  <Plus size={20} strokeWidth={2.5} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: "1.125rem", fontWeight: 700, color: "#0F172A" }}>
                    Create New System User
                  </h3>
                  <p style={{ margin: "2px 0 0", fontSize: "0.8125rem", color: "#64748B" }}>
                    Add an administrator, editor, or super admin with custom permissions.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateOpen(false)}
                style={{ background: "transparent", border: "none", color: "#94A3B8", cursor: "pointer", padding: "4px" }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} style={{ padding: "24px 28px" }}>
              <div style={{ marginBottom: "18px" }}>
                <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                  Full Name
                </label>
                <div style={{ position: "relative" }}>
                  <UserIcon size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#94A3B8" }} />
                  <input
                    id="input-create-name"
                    type="text"
                    required
                    placeholder="e.g. Sarah Jenkins"
                    value={createName}
                    onChange={(e) => setCreateName(e.target.value)}
                    style={{ width: "100%", padding: "10px 14px 10px 38px", borderRadius: "10px", border: "1px solid #CBD5E1", fontSize: "0.875rem", color: "#0F172A", outline: "none" }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: "18px" }}>
                <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                  Email Address
                </label>
                <div style={{ position: "relative" }}>
                  <Mail size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#94A3B8" }} />
                  <input
                    id="input-create-email"
                    type="email"
                    required
                    placeholder="sarah@pixzora.com"
                    value={createEmail}
                    onChange={(e) => setCreateEmail(e.target.value)}
                    style={{ width: "100%", padding: "10px 14px 10px 38px", borderRadius: "10px", border: "1px solid #CBD5E1", fontSize: "0.875rem", color: "#0F172A", outline: "none" }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                  Initial Password
                </label>
                <div style={{ position: "relative" }}>
                  <Lock size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#94A3B8" }} />
                  <input
                    id="input-create-password"
                    type="text"
                    required
                    value={createPassword}
                    onChange={(e) => setCreatePassword(e.target.value)}
                    style={{ width: "100%", padding: "10px 14px 10px 38px", borderRadius: "10px", border: "1px solid #CBD5E1", fontSize: "0.875rem", color: "#0F172A", fontFamily: "monospace", outline: "none" }}
                  />
                </div>
                <div style={{ fontSize: "0.75rem", color: "#64748B", marginTop: "4px" }}>
                  Member will use this password to sign in to Pixzora.
                </div>
              </div>

              <div style={{ marginBottom: "22px" }}>
                <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, color: "#334155", marginBottom: "8px" }}>
                  Select System Role
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  {[
                    { key: "admin", label: "Admin", desc: "Queue approval & schedules", badge: "Most Common" },
                    { key: "super_admin", label: "Super Admin", desc: "Full system & user access", badge: "Unrestricted" },
                    { key: "editor", label: "Editor", desc: "Drafting & generation only", badge: "Restricted" },
                    { key: "viewer", label: "Viewer", desc: "Read-only metrics & audit", badge: "Read-only" },
                  ].map((r) => {
                    const isSelected = createRole === r.key;
                    return (
                      <div
                        key={r.key}
                        onClick={() => handleCreateRoleChange(r.key)}
                        style={{
                          border: `2px solid ${isSelected ? "#6366F1" : "#E2E8F0"}`,
                          background: isSelected ? "#EEF2FF" : "#FFFFFF",
                          borderRadius: "12px",
                          padding: "12px",
                          cursor: "pointer",
                          transition: "all 0.15s ease",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontWeight: 700, fontSize: "0.875rem", color: isSelected ? "#4338CA" : "#0F172A" }}>
                            {r.label}
                          </span>
                          <span style={{ fontSize: "0.6875rem", padding: "2px 6px", borderRadius: "4px", background: isSelected ? "#C7D2FE" : "#F1F5F9", color: isSelected ? "#3730A3" : "#64748B", fontWeight: 600 }}>
                            {r.badge}
                          </span>
                        </div>
                        <div style={{ fontSize: "0.75rem", color: "#64748B", marginTop: "4px" }}>{r.desc}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: "10px", padding: "12px 14px", fontSize: "0.8125rem", color: "#475569", marginBottom: "24px", display: "flex", alignItems: "center", gap: "8px" }}>
                <Sparkles size={16} style={{ color: "#6366F1", flexShrink: 0 }} />
                <span>
                  Initial permissions will be initialized with standard <strong>{createRole.replace("_", " ")}</strong> presets ({createPerms.length} permissions).
                </span>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  style={{ padding: "10px 18px", borderRadius: "10px", background: "#F1F5F9", color: "#475569", border: "none", fontWeight: 600, fontSize: "0.875rem", cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  id="btn-submit-create-user"
                  type="submit"
                  disabled={isPending}
                  style={{ padding: "10px 22px", borderRadius: "10px", background: "#4F46E5", color: "white", border: "none", fontWeight: 600, fontSize: "0.875rem", cursor: isPending ? "wait" : "pointer", boxShadow: "0 2px 8px rgba(79, 70, 229, 0.35)", display: "inline-flex", alignItems: "center", gap: "8px" }}
                >
                  {isPending && <Loader2 size={16} className="animate-spin" />}
                  Create System User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MANAGE PERMISSIONS CHECKBOX MODAL */}
      {permModalUser && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.6)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "20px",
          }}
          onClick={() => setPermModalUser(null)}
        >
          <div
            style={{
              background: "#FFFFFF",
              borderRadius: "20px",
              width: "100%",
              maxWidth: "680px",
              maxHeight: "92vh",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
              border: "1px solid #E2E8F0",
              overflow: "hidden",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                padding: "20px 24px",
                borderBottom: "1px solid #E2E8F0",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "#FAFAFA",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div
                  style={{
                    width: "42px",
                    height: "42px",
                    borderRadius: "12px",
                    background: "#EDE9FE",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#6366F1",
                  }}
                >
                  <KeyRound size={20} />
                </div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <h3 style={{ margin: 0, fontSize: "1.125rem", fontWeight: 700, color: "#0F172A" }}>
                      Manage Permissions: {permModalUser.name}
                    </h3>
                    <span style={{ padding: "2px 8px", borderRadius: "9999px", background: "#E0E7FF", color: "#4338CA", fontSize: "0.6875rem", fontWeight: 700 }}>
                      {permModalUser.roleName}
                    </span>
                  </div>
                  <p style={{ margin: "2px 0 0", fontSize: "0.8125rem", color: "#64748B" }}>
                    Select and unselect checkboxes to customize granular permissions for {permModalUser.email}.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setPermModalUser(null)}
                style={{ background: "transparent", border: "none", color: "#94A3B8", cursor: "pointer", padding: "4px" }}
              >
                <X size={20} />
              </button>
            </div>

            <div
              style={{
                padding: "14px 24px",
                borderBottom: "1px solid #F1F5F9",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "12px",
                flexWrap: "wrap",
                background: "#FFFFFF",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <button
                  type="button"
                  onClick={() => setSelectedPerms(ALL_PERMISSIONS.map((p) => p.name))}
                  style={{ display: "inline-flex", alignItems: "center", gap: "5px", padding: "6px 10px", borderRadius: "6px", background: "#F1F5F9", color: "#334155", fontSize: "0.75rem", fontWeight: 600, border: "1px solid #CBD5E1", cursor: "pointer" }}
                >
                  <CheckSquare size={13} />
                  Select All
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedPerms([])}
                  style={{ display: "inline-flex", alignItems: "center", gap: "5px", padding: "6px 10px", borderRadius: "6px", background: "#F1F5F9", color: "#334155", fontSize: "0.75rem", fontWeight: 600, border: "1px solid #CBD5E1", cursor: "pointer" }}
                >
                  <Square size={13} />
                  Deselect All
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const defaults = DEFAULT_ROLE_PERMS[permModalUser.roleName.toLowerCase()] || [];
                    setSelectedPerms(defaults);
                  }}
                  style={{ display: "inline-flex", alignItems: "center", gap: "5px", padding: "6px 10px", borderRadius: "6px", background: "#EDE9FE", color: "#6D28D9", fontSize: "0.75rem", fontWeight: 600, border: "1px solid #DDD6FE", cursor: "pointer" }}
                >
                  <Shield size={13} />
                  Role Defaults
                </button>
              </div>

              <div style={{ position: "relative", minWidth: "180px" }}>
                <Search size={14} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#94A3B8" }} />
                <input
                  type="text"
                  placeholder="Filter permissions..."
                  value={permSearch}
                  onChange={(e) => setPermSearch(e.target.value)}
                  style={{ padding: "6px 10px 6px 30px", borderRadius: "8px", border: "1px solid #E2E8F0", fontSize: "0.8125rem", outline: "none", width: "100%" }}
                />
              </div>
            </div>

            <div
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "20px 24px",
                display: "flex",
                flexDirection: "column",
                gap: "20px",
              }}
            >
              {Object.keys(categories).length === 0 ? (
                <div style={{ textAlign: "center", color: "#64748B", padding: "30px 0" }}>
                  No permissions match &quot;{permSearch}&quot;
                </div>
              ) : (
                Object.entries(categories).map(([categoryName, perms]) => (
                  <div key={categoryName}>
                    <div
                      style={{
                        fontSize: "0.8125rem",
                        fontWeight: 700,
                        color: "#0F172A",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        marginBottom: "10px",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <span>{categoryName}</span>
                      <span style={{ fontSize: "0.6875rem", background: "#F1F5F9", color: "#64748B", padding: "1px 6px", borderRadius: "9999px" }}>
                        {perms.length}
                      </span>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      {perms.map((p) => {
                        const isChecked = selectedPerms.includes(p.name);
                        return (
                          <div
                            key={p.name}
                            id={`checkbox-item-${p.name}`}
                            onClick={() => handleTogglePerm(p.name)}
                            style={{
                              display: "flex",
                              alignItems: "flex-start",
                              gap: "12px",
                              padding: "10px 14px",
                              borderRadius: "10px",
                              border: `1px solid ${isChecked ? (p.isCritical ? "#DDD6FE" : "#C7D2FE") : "#E2E8F0"}`,
                              background: isChecked ? (p.isCritical ? "#FAF5FF" : "#EEF2FF") : "#FFFFFF",
                              cursor: "pointer",
                              transition: "all 0.12s ease",
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              readOnly
                              style={{ width: "18px", height: "18px", marginTop: "2px", accentColor: "#4F46E5", cursor: "pointer" }}
                            />
                            <div style={{ flex: 1 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <span style={{ fontFamily: "ui-monospace, monospace", fontSize: "0.8125rem", fontWeight: 700, color: isChecked ? "#312E81" : "#0F172A" }}>
                                  {p.name}
                                </span>
                                {p.isCritical && (
                                  <span style={{ fontSize: "0.6875rem", padding: "1px 6px", borderRadius: "4px", background: "#F5F3FF", color: "#7C3AED", fontWeight: 700, border: "1px solid #DDD6FE" }}>
                                    Publishing Gate
                                  </span>
                                )}
                              </div>
                              <div style={{ fontSize: "0.75rem", color: "#64748B", marginTop: "2px" }}>
                                {p.description}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div
              style={{
                padding: "16px 24px",
                borderTop: "1px solid #E2E8F0",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "#FAFAFA",
              }}
            >
              <div style={{ fontSize: "0.8125rem", color: "#475569" }}>
                Selected: <strong style={{ color: "#0F172A" }}>{selectedPerms.length} of {ALL_PERMISSIONS.length}</strong> permissions granted
              </div>

              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  type="button"
                  onClick={() => setPermModalUser(null)}
                  style={{ padding: "8px 16px", borderRadius: "8px", background: "#FFFFFF", border: "1px solid #CBD5E1", color: "#475569", fontWeight: 600, fontSize: "0.875rem", cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  id="btn-save-permissions"
                  type="button"
                  disabled={isPending}
                  onClick={handleSavePermissions}
                  style={{ padding: "8px 20px", borderRadius: "8px", background: "#4F46E5", color: "white", border: "none", fontWeight: 600, fontSize: "0.875rem", cursor: isPending ? "wait" : "pointer", boxShadow: "0 2px 6px rgba(79, 70, 229, 0.3)", display: "inline-flex", alignItems: "center", gap: "6px" }}
                >
                  {isPending && <Loader2 size={15} className="animate-spin" />}
                  Save Permissions
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
