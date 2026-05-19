// 별자리 좌표 생성기 — day_number 시드로 결정적 PRNG.
// 같은 날엔 모든 사용자가 같은 별자리를 본다.

export type StarPosition = { slot: number; x: number; y: number };

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const X_MIN = 10;   // %
const X_MAX = 90;
const Y_MIN = 30;
const Y_MAX = 80;
const MIN_DIST = 14; // 별 사이 최소 거리 (% 단위, 유클리드)

/** day_number 시드로 10개 별 위치를 생성. min-distance 제약 + 폴백. */
export function generatePositions(dayNumber: number, count = 10): StarPosition[] {
  const rng = mulberry32(dayNumber * 2654435761);
  const placed: StarPosition[] = [];
  let attempts = 0;
  while (placed.length < count && attempts < 2000) {
    attempts++;
    const x = X_MIN + rng() * (X_MAX - X_MIN);
    const y = Y_MIN + rng() * (Y_MAX - Y_MIN);
    let ok = true;
    for (const p of placed) {
      const dx = p.x - x;
      const dy = p.y - y;
      if (dx * dx + dy * dy < MIN_DIST * MIN_DIST) {
        ok = false;
        break;
      }
    }
    if (ok) placed.push({ slot: placed.length + 1, x, y });
  }
  // 못 채운 경우 균등 폴백 (희박)
  while (placed.length < count) {
    const idx = placed.length;
    const col = idx % 5;
    const row = Math.floor(idx / 5);
    placed.push({
      slot: idx + 1,
      x: X_MIN + ((X_MAX - X_MIN) * (col + 0.5)) / 5,
      y: Y_MIN + ((Y_MAX - Y_MIN) * (row + 0.5)) / 2,
    });
  }
  return placed;
}
