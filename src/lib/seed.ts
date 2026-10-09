import { db } from "./db";
import { user } from "./db/auth-schema";
import crypto from "crypto";

async function main() {
  console.log("Seeding database...");
  
  // We need to create a test user since signup is disabled by default for an admin panel
  // We'll use Better Auth's expected schema format
  
  try {
    await db.insert(user).values({
      id: crypto.randomUUID(),
      name: "Administrator",
      email: "admin@pixzora.com",
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    console.log("✅ Seeded test user: admin@pixzora.com");
    console.log("⚠️ Password: To login, you will need to add a password via Better Auth, or just sign up through a temporary route.");
  } catch (error) {
    console.error("Error seeding:", error);
  }
}

main().then(() => process.exit(0)).catch(() => process.exit(1));
