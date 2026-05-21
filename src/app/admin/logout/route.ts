import { NextResponse } from "next/server";
import { adminLogout } from "@/lib/actions/admin";

/**
 * POST 로만 로그아웃 허용 — GET 로그아웃은 외부 사이트의 <img src=...> 같은
 * CSRF 패턴에 무방비라 차단.
 */
export async function POST() {
  await adminLogout();
  return NextResponse.redirect(
    new URL("/admin", process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000")
  );
}
