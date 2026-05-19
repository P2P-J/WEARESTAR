// KST(Asia/Seoul) 기준 시간 유틸. 한국은 DST 없음.

export const KST_TZ = "Asia/Seoul";

/** 오늘의 KST 날짜 문자열 (YYYY-MM-DD) */
export function todayKstDate(now: Date = new Date()): string {
  // en-CA 로케일은 ISO 8601 형식(YYYY-MM-DD)을 보장
  return now.toLocaleDateString("en-CA", { timeZone: KST_TZ });
}

/** 오늘의 KST 자정 (UTC Date 객체) */
export function midnightKst(dateKst: string): Date {
  // YYYY-MM-DD 의 자정 KST → UTC = 전날 15:00
  // 'YYYY-MM-DDTHH:mm:ss+09:00' 형식으로 명시
  return new Date(`${dateKst}T00:00:00+09:00`);
}

/** 사이트 출시일(SITE_LAUNCH_DATE)로부터 day_number 계산 (1-based) */
export function dayNumberFromDate(dateKst: string, launchDateKst: string): number {
  const ms = midnightKst(dateKst).getTime() - midnightKst(launchDateKst).getTime();
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));
  return days + 1; // launch == D+1
}

/** day_number → KST 날짜 문자열 */
export function dateFromDayNumber(dayNumber: number, launchDateKst: string): string {
  const launch = midnightKst(launchDateKst);
  const target = new Date(launch.getTime() + (dayNumber - 1) * 24 * 60 * 60 * 1000);
  return target.toLocaleDateString("en-CA", { timeZone: KST_TZ });
}

/** "2026 · 05 · 19 · TUE · KST" 같은 헤더 문자열 */
export function formatKstHeader(dateKst: string): string {
  const d = new Date(`${dateKst}T00:00:00+09:00`);
  const wd = d
    .toLocaleDateString("en-US", { weekday: "short", timeZone: KST_TZ })
    .toUpperCase();
  const [y, m, day] = dateKst.split("-");
  return `${y} · ${m} · ${day} · ${wd} · KST`;
}

/** 다음 자정까지 남은 ms */
export function msUntilNextKstMidnight(now: Date = new Date()): number {
  const today = todayKstDate(now);
  const nextMid = new Date(midnightKst(today).getTime() + 24 * 60 * 60 * 1000);
  return nextMid.getTime() - now.getTime();
}

/** 엔트리의 created_at → "HH:MM" KST */
export function formatHHMM(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-GB", {
    timeZone: KST_TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

/** 환경변수에서 출시일 가져오기 (없으면 오늘로 폴백 — 개발 편의용) */
export function launchDate(): string {
  return process.env.SITE_LAUNCH_DATE || todayKstDate();
}
