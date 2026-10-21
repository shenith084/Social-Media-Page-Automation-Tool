import { Metadata } from "next";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { users, roles, userRoles, userPermissionGrants, permissions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { UsersClient, UserRow } from "@/components/admin/users-client";
import { getCurrentUserSession } from "@/lib/rbac-server";

export const metadata: Metadata = { title: "Users & Permissions | Pixzora Social" };
export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const current = await getCurrentUserSession();
  if (!current || (!current.isSuperAdmin && !current.hasPermission("users.manage"))) {
    redirect("/dashboard");
  }

  let allUsers: (typeof users.$inferSelect)[] = [];
  let assignedRoles: { userId: string; roleName: string }[] = [];
  let userGrants: { userId: string; permName: string }[] = [];

  try {
    allUsers = await db.select().from(users);

    assignedRoles = await db
      .select({
        userId: userRoles.userId,
        roleName: roles.name,
      })
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.id));

    userGrants = await db
      .select({
        userId: userPermissionGrants.userId,
        permName: permissions.name,
      })
      .from(userPermissionGrants)
      .innerJoin(permissions, eq(userPermissionGrants.permissionId, permissions.id));
  } catch (err) {
    console.warn("Could not load users/roles from DB:", err);
  }

  const roleByUserId = new Map<string, string>();
  for (const ur of assignedRoles) {
    roleByUserId.set(ur.userId, ur.roleName);
  }

  const permsByUserId = new Map<string, string[]>();
  for (const ug of userGrants) {
    const list = permsByUserId.get(ug.userId) || [];
    list.push(ug.permName);
    permsByUserId.set(ug.userId, list);
  }

  // Ensure default showcase users exist if DB happens to have none
  if (allUsers.length === 0) {
    allUsers = [
      {
        id: "usr-super-admin",
        name: "Shenith Chanidu",
        email: "shenith222@gmail.com",
        isActive: true,
        passwordHash: "hash",
        mustChangePassword: false,
        totpSecret: null,
        totpEnabled: false,
        lastSignInAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: null,
        updatedBy: null,
      },
      {
        id: "usr-admin-1",
        name: "Administrator",
        email: "admin@pixzora.com",
        isActive: true,
        passwordHash: "hash",
        mustChangePassword: false,
        totpSecret: null,
        totpEnabled: false,
        lastSignInAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: null,
        updatedBy: null,
      },
    ];
  }

  const initialUsers: UserRow[] = allUsers.map((u) => {
    let role = roleByUserId.get(u.id);
    if (!role) {
      if (u.email === "shenith222@gmail.com") role = "super_admin";
      else if (u.email.includes("admin")) role = "admin";
      else role = "editor";
    }

    const perms = permsByUserId.get(u.id) || [];

    return {
      id: u.id,
      name: u.name,
      email: u.email,
      isActive: u.isActive,
      roleName: role,
      permissions: perms,
    };
  });

  return (
    <div className="admin-page-container">
      <UsersClient initialUsers={initialUsers} currentUserEmail={current.email} />
    </div>
  );
}
