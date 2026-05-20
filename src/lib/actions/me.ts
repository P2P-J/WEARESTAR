"use server";

import { db, isDbConfigured } from "@/lib/db/client";
import { authorHash } from "@/lib/fingerprint/server";

/** 현재 fingerprint 로 식별되는 사용자가 특정 일자에 남긴 슬롯이 있으면 반환 */
export async function findMySlot(input: {
  clientFp: string;
  dayId: number;
}): Promise<{ slot: number | null }> {
  if (!isDbConfigured()) return { slot: null };
  if (!input.clientFp || input.clientFp.length < 16) return { slot: null };

  const ah = authorHash(input.clientFp, input.dayId);
  const sql = db();
  try {
    const rows = (await sql`
      SELECT slot_number FROM entries
      WHERE day_id = ${input.dayId}::bigint
        AND author_hash = ${ah}
        AND is_deleted = false
      LIMIT 1
    `) as { slot_number: number }[];
    return { slot: rows[0]?.slot_number ?? null };
  } catch {
    return { slot: null };
  }
}
