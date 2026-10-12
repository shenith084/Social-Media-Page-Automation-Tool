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

// Clean Neon connection URL to avoid pooler timeout issues in local dev
const cleanUrl = connectionString.replace("-pooler", "").replace("&channel_binding=require", "");

const client: postgres.Sql =
  global._pgClient ??
  postgres(cleanUrl, {
    max: 5,
    idle_timeout: 30,
    connect_timeout: 30,
    prepare: false,
  });

if (process.env.NODE_ENV !== "production") {
  global._pgClient = client;
}

export const db = drizzle(client, { schema });

export type Database = typeof db;
