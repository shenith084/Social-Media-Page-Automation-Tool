import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

declare global {
  // eslint-disable-next-line no-var
  var _pgClient: postgres.Sql | undefined;
}

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not set");
}

// Prevent multiple connections in development (Next.js hot-reload)
const client: postgres.Sql = global._pgClient ?? postgres(connectionString, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
});

if (process.env.NODE_ENV !== "production") {
  global._pgClient = client;
}

export const db = drizzle(client, { schema });

export type Database = typeof db;
