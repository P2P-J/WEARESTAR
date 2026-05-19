"use server";

import { supabaseServer, isSupabaseConfigured } from "@/lib/supabase/server";
import { authorHash } from "@/lib/fingerprint/server";

/** 현재 fingerprint 로 식별되는 사용자가 특정 일자에 남긴 슬롯이 있으면 반환 */
export async function findMySlot(input: {
  clientFp: string;
  dayId: number;
}): Promise<{ slot: number | null }> {
  if (!isSupabaseConfigured()) return { slot: null };
  if (!input.clientFp || input.clientFp.length < 16) return { slot: null };

  const ah = authorHash(input.clientFp, input.dayId);
  const sb = supabaseServer();
  const { data, error } = await sb
    .from("entries")
    .select("slot_number")
    .eq("day_id", input.dayId)
    .eq("author_hash", ah)
    .eq("is_deleted", false)
    .maybeSingle();

  if (error || !data) return { slot: null };
  return { slot: data.slot_number };
}
