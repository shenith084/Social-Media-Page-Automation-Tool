import { db } from "./src/lib/db/index.js";
import { pages, users, queueItems } from "./src/lib/db/schema.js";

async function check() {
  const allPages = await db.select().from(pages);
  console.log("Pages:", allPages);
  
  const allUsers = await db.select().from(users);
  console.log("Users:", allUsers);
  
  const allQueue = await db.select().from(queueItems);
  console.log("Queue:", allQueue);
  
  process.exit(0);
}
check();
