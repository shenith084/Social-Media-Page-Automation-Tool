"use server";

import { db } from "@/lib/db";
import { users, roles, userRoles, permissions, userPermissionGrants } from "@/lib/db/schema";
import { user as authUser, account as authAccount } from "@/lib/db/auth-schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { hashPassword as betterAuthHash, verifyPassword as betterAuthVerify } from "better-auth/crypto";
import crypto from "node:crypto";


async function verifyPasswordHash(password: string, storedHash?: string | null): Promise<boolean> {
  if (!storedHash) return false;
  
  // 1. Better-Auth native scrypt (r: 16)
  try {
    const isValid = await betterAuthVerify({ hash: storedHash, password });
    if (isValid) return true;
  } catch {
    // continue to fallback
  }

  // 2. Node.js standard scrypt (r: 8) fallback for legacy hashes
  try {
    const parts = storedHash.split(":");
    if (parts.length === 2) {
      const [salt, expectedKey] = parts;
      const computedKey = crypto.scryptSync(password, salt, 64).toString("hex");
      try {
        if (crypto.timingSafeEqual(Buffer.from(computedKey, "hex"), Buffer.from(expectedKey, "hex"))) {
          return true;
        }
      } catch {
        if (computedKey === expectedKey) return true;
      }
    }
  } catch {
    // continue
  }

  return false;
}

async function hashPassword(password: string): Promise<string> {
  return await betterAuthHash(password);
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

    const hashedPassword = await hashPassword(password);
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
        accountId: authUserId,
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

export async function changeUserPasswordAction(data: {
  currentPassword: string;
  newPassword: string;
}) {
  try {
    const reqHeaders = await headers();
    const session = await auth.api.getSession({ headers: reqHeaders });
    if (!session || !session.user) {
      return { success: false, error: "Unauthorized. Please sign in again." };
    }

    const { currentPassword, newPassword } = data;
    if (!currentPassword) {
      return { success: false, error: "Current password is required." };
    }
    if (!newPassword || newPassword.length < 8) {
      return { success: false, error: "New password must be at least 8 characters long." };
    }
    if (currentPassword === newPassword) {
      return { success: false, error: "New password must be different from current password." };
    }

    const userEmail = session.user.email.toLowerCase();
    const userId = session.user.id;

    // Check account in authAccount
    const accounts = await db.select().from(authAccount).where(
      and(eq(authAccount.userId, userId), eq(authAccount.providerId, "credential"))
    );

    // Also check application users table
    const appUsers = await db.select().from(users).where(eq(users.email, userEmail));
    const appUser = appUsers[0];

    let isCurrentValid = false;

    // 1. Try Better-Auth changePassword first
    try {
      await auth.api.changePassword({
        body: {
          currentPassword,
          newPassword,
          revokeOtherSessions: false,
        },
        headers: reqHeaders,
      });
      isCurrentValid = true;
    } catch (authErr: any) {
      // If Better-Auth throws (e.g. because of custom scrypt hash from seeding/createUserAction),
      // we check our scrypt verification
      if (accounts[0]?.password && await verifyPasswordHash(currentPassword, accounts[0].password)) {
        isCurrentValid = true;
      } else if (appUser?.passwordHash && await verifyPasswordHash(currentPassword, appUser.passwordHash)) {
        isCurrentValid = true;
      }
    }

    if (!isCurrentValid) {
      return { success: false, error: "Current password is incorrect. Please try again." };
    }

    // Hash the new password using scrypt
    const newHashed = await hashPassword(newPassword);

    // Update application users table
    await db.update(users)
      .set({ passwordHash: newHashed, updatedAt: new Date() })
      .where(eq(users.email, userEmail));

    // Update Better-Auth account table
    if (accounts.length > 0) {
      await db.update(authAccount)
        .set({ password: newHashed, updatedAt: new Date() })
        .where(eq(authAccount.id, accounts[0].id));
    }

    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("changeUserPasswordAction error:", err);
    return { success: false, error: message };
  }
}

