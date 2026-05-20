// 한 일자의 모든 데이터(일자 메타 + 별 위치 + 작성된 entries)를 묶어서 반환.

import { db, isDbConfigured } from "@/lib/db/client";
import { Day, DayBundle, Entry, StarSlot } from "@/lib/types";
import { generatePositions } from "@/lib/day/positions";
import {
  dayNumberFromDate,
  launchDate,
  todayKstDate,
  dateFromDayNumber,
} from "@/lib/day/time";

/** 일자 메타가 없으면 생성하고, 별 좌표도 시드해서 day 반환. */
export async function ensureDayByDate(dateKst: string): Promise<Day> {
  const sql = db();
  const dayNumber = dayNumberFromDate(dateKst, launchDate());
  const positions = generatePositions(dayNumber).map((p) => ({
    slot: p.slot,
    x: Number(p.x.toFixed(2)),
    y: Number(p.y.toFixed(2)),
  }));

  const ensured = (await sql`
    SELECT ensure_day(${dateKst}::date, ${dayNumber}::int, ${JSON.stringify(positions)}::jsonb) AS id
  `) as { id: number }[];

  const dayId = ensured[0]?.id;
  if (!dayId) throw new Error("ensure_day returned no id");

  const dayRows = (await sql`
    SELECT id, day_number, date_kst::text AS date_kst, opens_at::text AS opens_at, closes_at::text AS closes_at
    FROM days WHERE id = ${dayId}::bigint
  `) as Day[];

  if (!dayRows[0]) throw new Error("day row not found after ensure_day");
  return dayRows[0];
}

/** 일자 묶음(별 위치 + entries) 가져오기. 데이터가 없는 슬롯은 entry=null. */
export async function getDayBundleByDate(dateKst: string): Promise<DayBundle> {
  if (!isDbConfigured()) {
    return mockBundleForDate(dateKst);
  }

  const day = await ensureDayByDate(dateKst);
  const sql = db();

  const [positionsRaw, entriesRaw] = await Promise.all([
    sql`
      SELECT slot_number, x_pct, y_pct
      FROM star_positions
      WHERE day_id = ${day.id}::bigint
    `,
    sql`
      SELECT id, day_id, slot_number, content, author_hash,
             created_at::text AS created_at, report_count, is_hidden, is_deleted
      FROM entries
      WHERE day_id = ${day.id}::bigint AND is_deleted = false
    `,
  ]);
  const positions = positionsRaw as unknown as {
    slot_number: number;
    x_pct: number;
    y_pct: number;
  }[];
  const entries = entriesRaw as unknown as Entry[];

  const entryMap = new Map<number, Entry>();
  entries.forEach((e) => entryMap.set(e.slot_number, e));

  const slots: StarSlot[] = positions
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
// 개발 폴백: DATABASE_URL이 없을 때 데모 데이터로 UI 확인 가능
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
