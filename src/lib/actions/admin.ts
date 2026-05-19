"use server";

import { cookies } from "next/headers";
import { supabaseServer, isSupabaseConfigured } from "@/lib/supabase/server";

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
  if (!isSupabaseConfigured()) return { ok: false, message: "Supabase 미설정." };
  if (!(await isAdmin())) return { ok: false, message: "권한 없음." };

  const patch: Record<string, boolean> = {};
  if (typeof input.isHidden === "boolean") patch.is_hidden = input.isHidden;
  if (typeof input.isDeleted === "boolean") patch.is_deleted = input.isDeleted;
  if (Object.keys(patch).length === 0) return { ok: true };

  const sb = supabaseServer();
  const { error } = await sb.from("entries").update(patch).eq("id", input.entryId);
  if (error) return { ok: false, message: error.message };
  return { ok: true };
}
