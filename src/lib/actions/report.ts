"use server";

import { db, isDbConfigured } from "@/lib/db/client";
import { authorHash } from "@/lib/fingerprint/server";

export type ReportResult =
  | { ok: true; reportCount: number; isHidden: boolean }
  | { ok: false; message: string };

export async function reportEntry(input: {
  entryId: number;
  dayId: number;
  clientFp: string;
  reason?: string;
}): Promise<ReportResult> {
  if (!isDbConfigured()) {
    return { ok: false, message: "DATABASE_URL 미설정." };
  }
  if (!input.clientFp || input.clientFp.length < 16) {
    return { ok: false, message: "신고에 필요한 식별 정보가 없어요." };
  }

  const reporterHash = authorHash(input.clientFp, input.dayId);
  const sql = db();
  try {
    const rows = (await sql`
      SELECT out_report_count, out_is_hidden
      FROM report_entry(${input.entryId}::bigint, ${reporterHash}, ${input.reason ?? null})
    `) as { out_report_count: number; out_is_hidden: boolean }[];
    const row = rows[0];
    return {
      ok: true,
      reportCount: row?.out_report_count ?? 0,
      isHidden: row?.out_is_hidden ?? false,
    };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("self_report")) {
      return { ok: false, message: "본인 글은 신고할 수 없어요." };
    }
    if (msg.includes("entry_not_found")) {
      return { ok: false, message: "이미 사라진 글이에요." };
    }
    if (process.env.NODE_ENV === "production") {
      return { ok: false, message: "잠시 후 다시 시도해주세요." };
    }
    return { ok: false, message: msg };
  }
}
