// Postgres local para desarrollo y pruebas (sin Docker): npm run pg-local
import EmbeddedPostgres from "embedded-postgres";
const pg = new EmbeddedPostgres({ databaseDir: process.env.PG_DIR ?? "./datos-locales/pg", user: "lunilla", password: "lunilla", port: 54329, persistent: true });
import { existsSync } from "node:fs";
if (!existsSync((process.env.PG_DIR ?? "./datos-locales/pg") + "/PG_VERSION")) await pg.initialise();
await pg.start();
try { await pg.createDatabase("lunilla"); } catch {}
console.log("Postgres local en postgresql://lunilla:lunilla@localhost:54329/lunilla");
process.on("SIGINT", async () => { await pg.stop(); process.exit(0); });
process.on("SIGTERM", async () => { await pg.stop(); process.exit(0); });
setInterval(() => {}, 1 << 30);
