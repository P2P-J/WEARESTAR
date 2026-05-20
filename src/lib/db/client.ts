// Neon serverless Postgres 클라이언트.
// HTTP 기반이라 Vercel Edge / Serverless 환경에서 콜드스타트 친화적.
//
// `claim_slot`, `report_entry`, `ensure_day` 같은 RPC 함수는 Postgres 안에서
// 트랜잭션/락을 처리하므로, 클라이언트 측 트랜잭션 없이 단일 SQL 호출로 충분하다.

import { neon, NeonQueryFunction } from "@neondatabase/serverless";

let cached: NeonQueryFunction<false, false> | null = null;

export function db(): NeonQueryFunction<false, false> {
  if (cached) return cached;
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("Missing env: DATABASE_URL (Neon connection string)");
  }
  cached = neon(url);
  return cached;
}

export function isDbConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL);
}
