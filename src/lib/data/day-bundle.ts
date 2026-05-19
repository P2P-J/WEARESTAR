// 한 일자의 모든 데이터(일자 메타 + 별 위치 + 작성된 entries)를 묶어서 반환.

import { supabaseServer, isSupabaseConfigured } from "@/lib/supabase/server";
import { Day, DayBundle, Entry, StarSlot } from "@/lib/types";
import { generatePositions } from "@/lib/day/positions";
import {
  dayNumberFromDate,
  launchDate,
  todayKstDate,
  dateFromDayNumber,
} from "@/lib/day/time";

/** 일자 메타가 없으면 생성하고, 별 좌표도 시드해서 day_id 반환. */
export async function ensureDayByDate(dateKst: string): Promise<Day> {
  const sb = supabaseServer();
  const dayNumber = dayNumberFromDate(dateKst, launchDate());
  const positions = generatePositions(dayNumber).map((p) => ({
    slot: p.slot,
    x: Number(p.x.toFixed(2)),
    y: Number(p.y.toFixed(2)),
  }));

  const { data, error } = await sb.rpc("ensure_day", {
    p_date_kst: dateKst,
    p_day_number: dayNumber,
    p_positions: positions,
  });
  if (error) throw new Error(`ensure_day failed: ${error.message}`);
  const dayId = data as number;

  const { data: dayRow, error: e2 } = await sb
    .from("days")
    .select("id, day_number, date_kst, opens_at, closes_at")
    .eq("id", dayId)
    .single();
  if (e2 || !dayRow) throw new Error(`day row not found: ${e2?.message ?? "?"}`);
  return dayRow as Day;
}

/** 일자 묶음(별 위치 + entries) 가져오기. 데이터가 없는 슬롯은 entry=null. */
export async function getDayBundleByDate(dateKst: string): Promise<DayBundle> {
  if (!isSupabaseConfigured()) {
    // 개발 폴백: Supabase 미설정 상태에서도 UI를 볼 수 있게.
    return mockBundleForDate(dateKst);
  }

  const day = await ensureDayByDate(dateKst);
  const sb = supabaseServer();

  const [{ data: positions }, { data: entries }] = await Promise.all([
    sb.from("star_positions").select("slot_number, x_pct, y_pct").eq("day_id", day.id),
    sb
      .from("entries")
      .select(
        "id, day_id, slot_number, content, author_hash, created_at, report_count, is_hidden, is_deleted"
      )
      .eq("day_id", day.id)
      .eq("is_deleted", false),
  ]);

  const entryMap = new Map<number, Entry>();
  (entries || []).forEach((e) => entryMap.set(e.slot_number, e as Entry));

  const slots: StarSlot[] = (positions || [])
    .map((p) => ({
      slot: p.slot_number,
      x: Number(p.x_pct),
      y: Number(p.y_pct),
      entry: entryMap.get(p.slot_number) || null,
    }))
    .sort((a, b) => a.slot - b.slot);

  return { day, slots };
}

/** day_number(D+N)로 가져오기 */
export async function getDayBundleByNumber(dayNumber: number): Promise<DayBundle> {
  const dateKst = dateFromDayNumber(dayNumber, launchDate());
  return getDayBundleByDate(dateKst);
}

/** 가장 최근 N일치 묶음 (오늘 포함, 내림차순). 아카이브용. */
export async function getRecentDayBundles(limit = 5, beforeDayNumber?: number): Promise<DayBundle[]> {
  const todayDayNumber = dayNumberFromDate(todayKstDate(), launchDate());
  const startFrom =
    beforeDayNumber && beforeDayNumber > 0 ? beforeDayNumber - 1 : todayDayNumber;

  const targets: number[] = [];
  for (let n = startFrom; n > startFrom - limit && n >= 1; n--) {
    targets.push(n);
  }

  return Promise.all(targets.map((n) => getDayBundleByNumber(n)));
}

// ─────────────────────────────────────────────────────────────────────────────
// 개발 폴백: Supabase 환경변수가 없을 때 표시할 데모 데이터
// ─────────────────────────────────────────────────────────────────────────────
function mockBundleForDate(dateKst: string): DayBundle {
  const dayNumber = dayNumberFromDate(dateKst, launchDate());
  const positions = generatePositions(dayNumber);
  const sample = [
    { slot: 1, time: "07:12", text: "첫차 기다리며 김이 나는 손바닥을 본다." },
    { slot: 2, time: "09:31", text: "엄마가 끓여준 미역국을 먹고 회사에 갔다." },
    { slot: 3, time: "13:04", text: "점심엔 비가 그쳤다. 그게 오늘의 다행." },
    { slot: 4, time: "15:47", text: "헤어진 사람과 닮은 뒷모습을 봤지만, 따라가지 않았다." },
    { slot: 5, time: "18:22", text: "퇴근길 골목에서 길고양이가 두 마리가 나란히 앉아 있었다." },
    { slot: 6, time: "21:05", text: "아무에게도 말 못한 한 줄을 여기에 두고 간다." },
    { slot: 7, time: "23:48", text: "잠이 안 와서 별을 켜러 왔다." },
  ];
  const slots: StarSlot[] = positions.map((p) => {
    const m = sample.find((s) => s.slot === p.slot);
    if (!m) return { slot: p.slot, x: p.x, y: p.y, entry: null };
    const created = new Date(`${dateKst}T${m.time}:00+09:00`).toISOString();
    return {
      slot: p.slot,
      x: p.x,
      y: p.y,
      entry: {
        id: p.slot,
        day_id: 0,
        slot_number: p.slot,
        content: m.text,
        author_hash: p.slot === 3 ? "self-demo" : "demo",
        created_at: created,
        report_count: 0,
        is_hidden: false,
        is_deleted: false,
      },
    };
  });
  return {
    day: {
      id: 0,
      day_number: dayNumber,
      date_kst: dateKst,
      opens_at: `${dateKst}T00:00:00+09:00`,
      closes_at: `${dateKst}T24:00:00+09:00`,
    },
    slots,
  };
}
