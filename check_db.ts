import { db } from "./src/lib/db";
import { generationItems } from "./src/lib/db/schema";

async function run() {
  const items = await db.select().from(generationItems);
  console.log("Total items in DB:", items.length);
  console.log(items.map(i => ({ id: i.id, headline: i.headline, status: i.status })));
  process.exit(0);
}
run().catch(console.error);
