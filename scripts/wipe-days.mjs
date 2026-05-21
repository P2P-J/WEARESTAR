// days 테이블을 비운다. entries / star_positions / reports 가 CASCADE 로 함께 비워짐.
// banned_words / admin_login_attempts 는 영향 없음.
// 사용: node scripts/wipe-days.mjs

import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";

neonConfig.webSocketConstructor = ws;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

function loadEnv() {
  try {
    const text = readFileSync(path.join(ROOT, ".env.local"), "utf8");
    for (const line of text.split("\n")) {
      const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
    }
  } catch {}
}
loadEnv();

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL 이 없어요.");
  process.exit(1);
}

const pool = new Pool({ connectionString: url });

async function run() {
  const client = await pool.connect();
  try {
    const { rows: before } = await client.query(
      `SELECT COUNT(*)::int AS days, (SELECT COUNT(*)::int FROM entries) AS entries FROM days`
    );
    console.log(`삭제 전: days=${before[0].days}, entries=${before[0].entries}`);

    await client.query(`TRUNCATE days RESTART IDENTITY CASCADE`);

    const { rows: after } = await client.query(
      `SELECT COUNT(*)::int AS days, (SELECT COUNT(*)::int FROM entries) AS entries FROM days`
    );
    console.log(`삭제 후: days=${after[0].days}, entries=${after[0].entries}`);
    console.log("\n✓ 새로운 SITE_LAUNCH_DATE 로 시작할 준비 완료");
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch((e) => {
  console.error("실패:", e.message);
  process.exit(1);
});
