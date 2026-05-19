// 공통 타입

export type Entry = {
  id: number;
  day_id: number;
  slot_number: number;
  content: string;
  author_hash: string;
  created_at: string;
  report_count: number;
  is_hidden: boolean;
  is_deleted: boolean;
};

export type Day = {
  id: number;
  day_number: number;
  date_kst: string;     // 'YYYY-MM-DD'
  opens_at: string;
  closes_at: string;
};

export type StarSlot = {
  slot: number;
  x: number;            // %
  y: number;            // %
  entry: Entry | null;  // null = 빈 슬롯
};

export type DayBundle = {
  day: Day;
  slots: StarSlot[];    // 길이 10
};
