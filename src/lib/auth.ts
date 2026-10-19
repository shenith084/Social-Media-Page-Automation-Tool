import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { hashPassword, verifyPassword } from "better-auth/crypto";
import { db } from "./db";
import * as authSchema from "./db/auth-schema";
import crypto from "node:crypto";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: authSchema.user,
      session: authSchema.session,
      account: authSchema.account,
      verification: authSchema.verification,
    },
  }),
  emailAndPassword: {
    enabled: true,
    password: {
      hash: hashPassword,
      verify: async ({ hash, password }: { hash: string; password: string }) => {
        if (!hash || !password) return false;

        // 1. Better-Auth native verification (scrypt r:16)
        try {
          const isValid = await verifyPassword({ hash, password });
          if (isValid) return true;
        } catch {
          // Fall through to fallback
        }

        // 2. Node standard scrypt fallback (r:8) for custom-hashed / migrated accounts
        try {
          const [salt, key] = hash.split(":");
          if (salt && key) {
            const computedKey = crypto.scryptSync(password, salt, 64).toString("hex");
            try {
              if (crypto.timingSafeEqual(Buffer.from(computedKey, "hex"), Buffer.from(key, "hex"))) {
                return true;
              }
            } catch {
              if (computedKey === key) return true;
            }
          }
        } catch {
          // ignore
        }

        return false;
      },
    },
  },
  trustedOrigins: [process.env.APP_URL || "http://localhost:3000"],
});
