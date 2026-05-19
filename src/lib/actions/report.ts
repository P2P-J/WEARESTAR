"use server";

import { supabaseServer, isSupabaseConfigured } from "@/lib/supabase/server";
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
  if (!isSupabaseConfigured()) {
    return { ok: false, message: "Supabase 환경변수 미설정." };
  }
  if (!input.clientFp || input.clientFp.length < 16) {
    return { ok: false, message: "신고에 필요한 식별 정보가 없어요." };
  }

  const reporterHash = authorHash(input.clientFp, input.dayId);
  const sb = supabaseServer();
  const { data, error } = await sb.rpc("report_entry", {
    p_entry_id: input.entryId,
    p_reporter_hash: reporterHash,
    p_reason: input.reason ?? null,
  });
  if (error) return { ok: false, message: error.message };
  const row = Array.isArray(data) ? data[0] : data;
  return {
    ok: true,
    reportCount: row?.out_report_count ?? 0,
    isHidden: row?.out_is_hidden ?? false,
  };
}
