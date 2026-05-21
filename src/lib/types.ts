// 공통 타입

/**
 * 클라이언트로 전송 가능한 entry. author_hash는 절대 포함되지 않는다 (익명성 보호).
 * 가려진 글(is_hidden)의 content는 서버에서 마스킹된 형태로 들어온다.
 */
export type Entry = {
  id: number;
  day_id: number;
  slot_number: number;
  content: string;
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
  entry: Entry | null;
};

export type DayBundle = {
  day: Day;
  slots: StarSlot[];    // 길이 10
};

/** 가려진 글이 화면에 표시될 때 쓰는 placeholder content. */
export const HIDDEN_CONTENT_MASK = "__HIDDEN__";
