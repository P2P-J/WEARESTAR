// db/schema.sql + db/seeds.sql 을 Neon DB 에 한 번에 적용.
// 사용: node scripts/apply-schema.mjs
//
// Neon WebSocket Pool 을 쓰면 트랜잭션 + 다중 문장 + PL/pgSQL 함수 정의를 그대로 보낼 수 있다.

import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";

// Node 환경에서 WebSocket 폴리필
neonConfig.webSocketConstructor = ws;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

// .env.local 에서 DATABASE_URL 읽기 (간단 파서)
function loadEnv() {
  try {
    const text = readFileSync(path.join(ROOT, ".env.local"), "utf8");
    for (const line of text.split("\n")) {
      const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
    }
  } catch {
    /* 무시 — env 가 다른 곳에서 주입돼 있을 수 있음 */
  }
}
loadEnv();

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL 이 없어요. .env.local 을 확인해주세요.");
  process.exit(1);
}

const schema = readFileSync(path.join(ROOT, "db/schema.sql"), "utf8");
const seeds = readFileSync(path.join(ROOT, "db/seeds.sql"), "utf8");

const pool = new Pool({ connectionString: url });

async function run() {
  const client = await pool.connect();
  try {
    console.log("→ schema.sql 적용 중...");
    await client.query(schema);
    console.log("✓ schema 적용 완료");

    console.log("→ seeds.sql 적용 중...");
    await client.query(seeds);
    console.log("✓ seeds 적용 완료");

    // 자가검증
    const { rows: tables } = await client.query(`
      SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename
    `);
    console.log("\n생성된 테이블:", tables.map((t) => t.tablename).join(", "));

    const { rows: funcs } = await client.query(`
      SELECT proname FROM pg_proc
      WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname='public')
      ORDER BY proname
    `);
    console.log("생성된 함수:  ", funcs.map((f) => f.proname).join(", "));

    const { rows: banned } = await client.query(`SELECT COUNT(*)::int AS c FROM banned_words`);
    console.log("비속어 시드:  ", banned[0].c, "개");
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch((e) => {
  console.error("실패:", e.message);
  process.exit(1);
});
