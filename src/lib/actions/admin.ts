"use server";

import { cookies } from "next/headers";
import { db, isDbConfigured } from "@/lib/db/client";

const COOKIE_KEY = "wearestar_admin";

function adminPassword(): string {
  return process.env.ADMIN_PASSWORD || "";
}

export async function isAdmin(): Promise<boolean> {
  const expected = adminPassword();
  if (!expected) return false;
  const c = await cookies();
  return c.get(COOKIE_KEY)?.value === expected;
}

export async function adminLogin(password: string): Promise<{ ok: boolean; message?: string }> {
  const expected = adminPassword();
  if (!expected) return { ok: false, message: "ADMIN_PASSWORD가 설정되지 않았어요." };
  if (password !== expected) return { ok: false, message: "비밀번호가 일치하지 않아요." };

  const c = await cookies();
  c.set(COOKIE_KEY, expected, {
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
  } catch (e: unknown) {
    return { ok: false, message: e instanceof Error ? e.message : String(e) };
  }
}
