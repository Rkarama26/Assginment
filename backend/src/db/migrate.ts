import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import "dotenv/config";


async function runMigrations() {
  const databaseUrl = process.env.DATABASE_URL;

  console.log("DATABASE_URL =", process.env.DATABASE_URL);
  if (!databaseUrl) {
    console.error("DATABASE_URL is required to run migrations");
    process.exit(1);
  }

  const client = postgres(databaseUrl, { max: 1 });
  const db = drizzle(client);

  console.log("Running migrations...");
  await migrate(db, { migrationsFolder: "./drizzle" });
  console.log("Migrations complete");
  await client.end();
}

runMigrations().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
