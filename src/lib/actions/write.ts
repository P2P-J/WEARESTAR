"use server";

import { supabaseServer, isSupabaseConfigured } from "@/lib/supabase/server";
import { authorHash } from "@/lib/fingerprint/server";
import { normalizeForFilter, findMatchedWord } from "@/lib/profanity/normalize";
import { ensureDayByDate } from "@/lib/data/day-bundle";
import { todayKstDate } from "@/lib/day/time";

export type WriteResult =
  | { ok: true; slot: number; entryId: number }
  | { ok: false; code: "config" | "validation" | "profanity" | "already_written" | "day_full" | "unknown"; message: string };

const MAX_LEN = 150;

export async function writeEntry(input: {
  content: string;
  clientFp: string;
}): Promise<WriteResult> {
  if (!isSupabaseConfigured()) {
    return {
      ok: false,
      code: "config",
      message: "Supabase 환경변수가 설정되지 않았어요. .env.local을 확인해주세요.",
    };
  }

  const raw = (input.content ?? "").trim();
  if (raw.length === 0 || raw.length > MAX_LEN) {
    return {
      ok: false,
      code: "validation",
      message: `한 줄은 1자 이상 ${MAX_LEN}자 이하여야 해요.`,
    };
  }
  if (!input.clientFp || input.clientFp.length < 16) {
    return {
      ok: false,
      code: "validation",
      message: "브라우저 식별이 어려워요. 새로고침 후 다시 시도해주세요.",
    };
  }

  // 비속어 체크
  const normalized = normalizeForFilter(raw);
  const sb = supabaseServer();
  const { data: dict, error: dictErr } = await sb
    .from("banned_words")
    .select("raw, normalized");
  if (dictErr) {
    return { ok: false, code: "unknown", message: `사전 조회 실패: ${dictErr.message}` };
  }
  const hit = findMatchedWord(normalized, dict || []);
  if (hit) {
    return {
      ok: false,
      code: "profanity",
      message: "조금 더 따뜻한 말로 남겨주세요.",
    };
  }

  // 오늘 일자 보장 (lazy)
  const day = await ensureDayByDate(todayKstDate());
  const ah = authorHash(input.clientFp, day.id);

  // 슬롯 확보 RPC
  const { data, error } = await sb.rpc("claim_slot", {
    p_day_id: day.id,
    p_author_hash: ah,
    p_content: raw,
  });

  if (error) {
    if (error.message.includes("already_written") || (error as { code?: string }).code === "P0001") {
      return {
        ok: false,
        code: "already_written",
        message: "오늘은 이미 한 줄을 남기셨어요. 내일 0시에 새 일기장이 열려요.",
      };
    }
    if (error.message.includes("day_full") || (error as { code?: string }).code === "P0002") {
      return {
        ok: false,
        code: "day_full",
        message: "오늘의 일기장은 모두 채워졌어요. 내일 0시에 새 일기장이 열려요.",
      };
    }
    return { ok: false, code: "unknown", message: error.message };
  }

  const row = Array.isArray(data) ? data[0] : data;
  return {
    ok: true,
    slot: row?.out_slot_number ?? 0,
    entryId: row?.out_entry_id ?? 0,
  };
}
