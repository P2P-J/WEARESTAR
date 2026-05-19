import { NextResponse } from "next/server";
import { adminLogout } from "@/lib/actions/admin";

export async function GET() {
  await adminLogout();
  return NextResponse.redirect(new URL("/admin", process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"));
}
