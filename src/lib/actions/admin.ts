"use server";

import { cookies, headers } from "next/headers";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { db, isDbConfigured } from "@/lib/db/client";

const COOKIE_KEY = "wearestar_admin";
const MAX_FAILURES = 5;
const LOCKOUT_MIN = 15;

function adminPassword(): string {
  return process.env.ADMIN_PASSWORD || "";
}

function serverSecret(): string {
  return process.env.SERVER_SECRET || "dev-only-secret-please-replace-me";
}

/** 쿠키 값 = HMAC(SERVER_SECRET, "admin-session|" + ADMIN_PASSWORD).
 *  비밀번호 자체는 절대 쿠키에 넣지 않으며, 비번/시크릿이 바뀌면 자동 만료. */
function expectedToken(): string {
  return createHmac("sha256", serverSecret())
    .update(`admin-session|${adminPassword()}`)
    .digest("hex");
}

function constantTimeEq(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) {
    // 길이 다르면 false 지만 timing 노출 줄이려 동일 길이 비교
    timingSafeEqual(ba, Buffer.alloc(ba.length));
    return false;
  }
  return timingSafeEqual(ba, bb);
}

async function clientSourceHash(): Promise<string> {
  // IP 가 신뢰 가능한 헤더에 있으면 사용, 없으면 'unknown' 으로 폴백.
  const h = await headers();
  const ip =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    "unknown";
  return createHash("sha256").update(`${ip}|${serverSecret()}`).digest("hex");
}

export async function isAdmin(): Promise<boolean> {
  if (!adminPassword()) return false;
  const c = await cookies();
  const got = c.get(COOKIE_KEY)?.value;
  if (!got) return false;
  return constantTimeEq(got, expectedToken());
}

export async function adminLogin(
  password: string
): Promise<{ ok: boolean; message?: string }> {
  const expected = adminPassword();
  if (!expected) return { ok: false, message: "ADMIN_PASSWORD가 설정되지 않았어요." };
  if (!isDbConfigured()) {
    return { ok: false, message: "DATABASE_URL 미설정." };
  }

  const sql = db();
  const sourceHash = await clientSourceHash();

  // 최근 LOCKOUT_MIN 분 동안 실패 횟수 확인
  try {
    const fails = (await sql`
      SELECT COUNT(*)::int AS n
      FROM admin_login_attempts
      WHERE succeeded = false
        AND source_hash = ${sourceHash}
        AND attempted_at > now() - (${LOCKOUT_MIN}::text || ' minutes')::interval
    `) as unknown as { n: number }[];

    if (fails[0]?.n >= MAX_FAILURES) {
      return {
        ok: false,
        message: `로그인 시도가 너무 많아요. ${LOCKOUT_MIN}분 뒤에 다시 시도해주세요.`,
      };
    }
  } catch {
    // rate limit 조회 실패는 빠르게 패스 (정상 로그인은 가능)
  }

  const supplied = Buffer.from(password ?? "");
  const expectedBuf = Buffer.from(expected);
  const sameLength = supplied.length === expectedBuf.length;
  // 길이 정보도 timing 으로 새지 않도록 동일 길이 비교 수행
  const eq = sameLength && timingSafeEqual(supplied, expectedBuf);

  // 시도 로그 (succeeded 보존을 위해 항상 INSERT)
  await sql`
    INSERT INTO admin_login_attempts (succeeded, source_hash)
    VALUES (${eq}, ${sourceHash})
  `;

  if (!eq) {
    return { ok: false, message: "비밀번호가 일치하지 않아요." };
  }

  const c = await cookies();
  c.set(COOKIE_KEY, expectedToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return { ok: true };
}

export async function adminLogout(): Promise<void> {
  const c = await cookies();
  c.delete(COOKIE_KEY);
}

export async function adminSetEntryFlags(input: {
  entryId: number;
  isHidden?: boolean;
  isDeleted?: boolean;
}): Promise<{ ok: boolean; message?: string }> {
  if (!isDbConfigured()) return { ok: false, message: "DATABASE_URL 미설정." };
  if (!(await isAdmin())) return { ok: false, message: "권한 없음." };
  if (!Number.isInteger(input.entryId) || input.entryId < 1) {
    return { ok: false, message: "잘못된 entry id." };
  }

  const sql = db();
  try {
    if (typeof input.isHidden === "boolean" && typeof input.isDeleted === "boolean") {
      await sql`
        UPDATE entries
        SET is_hidden = ${input.isHidden}, is_deleted = ${input.isDeleted}
        WHERE id = ${input.entryId}::bigint
      `;
    } else if (typeof input.isHidden === "boolean") {
      await sql`
        UPDATE entries SET is_hidden = ${input.isHidden} WHERE id = ${input.entryId}::bigint
      `;
    } else if (typeof input.isDeleted === "boolean") {
      await sql`
        UPDATE entries SET is_deleted = ${input.isDeleted} WHERE id = ${input.entryId}::bigint
      `;
    }
    return { ok: true };
  } catch {
    return { ok: false, message: "처리 중 오류가 발생했어요." };
  }
}
