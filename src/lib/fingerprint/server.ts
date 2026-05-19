// 서버에서 author_hash 계산.
// DB 에는 일자별로 변하는 해시만 저장 → 날짜를 넘어 동일 인물 추적 불가.

import { createHash } from "node:crypto";

function getServerSecret(): string {
  const s = process.env.SERVER_SECRET;
  if (!s || s.length < 16) {
    // 개발 편의를 위해 폴백 — 운영에선 반드시 .env에 16자 이상 설정
    return "dev-only-secret-please-replace-me";
  }
  return s;
}

/** 클라이언트 fingerprint + day_id + 서버 시크릿 → author_hash */
export function authorHash(clientFp: string, dayId: number | string): string {
  const h = createHash("sha256");
  h.update(`${clientFp}|${dayId}|${getServerSecret()}`);
  return h.digest("hex");
}
