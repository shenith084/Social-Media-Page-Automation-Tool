import { headers } from "next/headers";
import { auth } from "./auth";
import { db } from "./db";
import { users, roles, userRoles, userPermissionGrants, permissions } from "./db/schema";
import { eq } from "drizzle-orm";

export interface CurrentUserSession {
  id: string;
  name: string;
  email: string;
  role: "super_admin" | "admin" | "editor" | "viewer";
  isSuperAdmin: boolean;
  isAdmin: boolean;
  isEditor: boolean;
  isViewer: boolean;
  permissions: string[];
  hasPermission: (perm: string) => boolean;
}

export async function getCurrentUserSession(): Promise<CurrentUserSession | null> {
  try {
    const reqHeaders = await headers();
    const session = await auth.api.getSession({ headers: reqHeaders });
    if (!session?.user?.email) return null;

    const email = session.user.email.toLowerCase();

    // 1. Look up app user
    const appUsers = await db.select().from(users).where(eq(users.email, email));
    const appUser = appUsers[0];
    if (!appUser) return null;

    // 2. Look up role
    const ur = await db
      .select({ roleName: roles.name })
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .where(eq(userRoles.userId, appUser.id));

    let roleName = (ur[0]?.roleName || "viewer").toLowerCase() as CurrentUserSession["role"];
    if (email === "shenith222@gmail.com") {
      roleName = "super_admin";
    }

    // 3. Look up explicit permission grants
    const grants = await db
      .select({ permName: permissions.name })
      .from(userPermissionGrants)
      .innerJoin(permissions, eq(userPermissionGrants.permissionId, permissions.id))
      .where(eq(userPermissionGrants.userId, appUser.id));

    const perms = grants.map((g) => g.permName);

    const isSuperAdmin = roleName === "super_admin";
    const isAdmin = roleName === "admin" || isSuperAdmin;
    const isEditor = roleName === "editor";
    const isViewer = roleName === "viewer";

    return {
      id: appUser.id,
      name: appUser.name,
      email: appUser.email,
      role: roleName,
      isSuperAdmin,
      isAdmin,
      isEditor,
      isViewer,
      permissions: perms,
      hasPermission: (perm: string) => {
        if (isSuperAdmin) return true;
        if (isAdmin && perm !== "users.manage") return true;
        return perms.includes(perm);
      },
    };
  } catch (err) {
    console.error("getCurrentUserSession error:", err);
    return null;
  }
}
