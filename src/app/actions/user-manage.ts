"use server";

import { db } from "@/lib/db";
import { users, roles, userRoles, permissions, userPermissionGrants } from "@/lib/db/schema";
import { user as authUser, account as authAccount } from "@/lib/db/auth-schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import crypto from "node:crypto";

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const key = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${key}`;
}

export async function createUserAction(data: {
  name: string;
  email: string;
  password?: string;
  roleName: string;
  permissionNames?: string[];
  isActive?: boolean;
}) {
  try {
    const email = data.email.trim().toLowerCase();
    const name = data.name.trim();
    const password = data.password && data.password.trim().length > 0 ? data.password.trim() : "Pixzora2026!";
    const roleName = data.roleName || "admin";
    const isActive = data.isActive !== false;

    // Check if user already exists in users table
    const existing = await db.select().from(users).where(eq(users.email, email));
    if (existing.length > 0) {
      return { success: false, error: "A user with this email already exists." };
    }

    const hashedPassword = hashPassword(password);
    const userId = crypto.randomUUID();

    // 1. Insert into application RBAC users table
    await db.insert(users).values({
      id: userId,
      name,
      email,
      passwordHash: hashedPassword,
      isActive,
      mustChangePassword: false,
    });

    // 2. Insert into better-auth tables so the user can log in
    try {
      const authUserId = userId;
      await db.insert(authUser).values({
        id: authUserId,
        name,
        email,
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }).onConflictDoNothing();

      const accountId = crypto.randomUUID();
      await db.insert(authAccount).values({
        id: accountId,
        accountId: email,
        providerId: "credential",
        userId: authUserId,
        password: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date(),
      }).onConflictDoNothing();
    } catch (authErr) {
      console.warn("Could not mirror to better-auth account:", authErr);
    }

    // 3. Assign role
    const targetRole = (await db.select().from(roles).where(eq(roles.name, roleName)))[0] ||
      (await db.select().from(roles).where(eq(roles.name, "admin")))[0];

    if (targetRole) {
      await db.insert(userRoles).values({
        userId,
        roleId: targetRole.id,
      });
    }

    // 4. Assign explicit permissions
    if (data.permissionNames && data.permissionNames.length > 0) {
      const allPerms = await db.select().from(permissions);
      const permMap = new Map(allPerms.map((p) => [p.name, p.id]));

      for (const pName of data.permissionNames) {
        const permId = permMap.get(pName);
        if (permId) {
          await db.insert(userPermissionGrants).values({
            userId,
            permissionId: permId,
            grantedBy: userId,
          }).onConflictDoNothing();
        }
      }
    }

    revalidatePath("/users");
    return { success: true, userId };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("createUserAction error:", err);
    return { success: false, error: message };
  }
}

export async function updateUserPermissionsAction(data: {
  userId: string;
  permissionNames: string[];
}) {
  try {
    const { userId, permissionNames } = data;

    // Remove existing grants
    await db.delete(userPermissionGrants).where(eq(userPermissionGrants.userId, userId));

    // Insert new grants
    if (permissionNames.length > 0) {
      const allPerms = await db.select().from(permissions);
      const permMap = new Map(allPerms.map((p) => [p.name, p.id]));

      for (const pName of permissionNames) {
        const permId = permMap.get(pName);
        if (permId) {
          await db.insert(userPermissionGrants).values({
            userId,
            permissionId: permId,
            grantedBy: userId,
          }).onConflictDoNothing();
        }
      }
    }

    revalidatePath("/users");
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("updateUserPermissionsAction error:", err);
    return { success: false, error: message };
  }
}

export async function updateUserRoleAction(data: {
  userId: string;
  roleName: string;
}) {
  try {
    const { userId, roleName } = data;

    const targetRole = (await db.select().from(roles).where(eq(roles.name, roleName)))[0];
    if (!targetRole) {
      return { success: false, error: "Role not found." };
    }

    await db.delete(userRoles).where(eq(userRoles.userId, userId));
    await db.insert(userRoles).values({
      userId,
      roleId: targetRole.id,
    });

    revalidatePath("/users");
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: message };
  }
}

export async function toggleUserStatusAction(data: {
  userId: string;
  isActive: boolean;
}) {
  try {
    const { userId, isActive } = data;

    await db.update(users).set({ isActive }).where(eq(users.id, userId));

    revalidatePath("/users");
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: message };
  }
}

export async function deleteUserAction(userId: string) {
  try {
    const targetUser = (await db.select().from(users).where(eq(users.id, userId)))[0];
    if (targetUser && targetUser.email === "shenith222@gmail.com") {
      return { success: false, error: "Primary Super Admin account cannot be deleted." };
    }

    await db.delete(userPermissionGrants).where(eq(userPermissionGrants.userId, userId));
    await db.delete(userRoles).where(eq(userRoles.userId, userId));
    await db.delete(users).where(eq(users.id, userId));

    try {
      await db.delete(authAccount).where(eq(authAccount.userId, userId));
      await db.delete(authUser).where(eq(authUser.id, userId));
    } catch {
      // ignore
    }

    revalidatePath("/users");
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: message };
  }
}
