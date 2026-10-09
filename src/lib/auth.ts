import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "./db";
import * as authSchema from "./db/auth-schema";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: authSchema.user,
      session: authSchema.session,
      account: authSchema.account,
      verification: authSchema.verification
    }
  }),
  emailAndPassword: {
    enabled: true,
  },
  trustedOrigins: [process.env.APP_URL || "http://localhost:3000"],
});
