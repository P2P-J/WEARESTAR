// 클라이언트 fingerprint 수집. 브라우저에서만 동작.
// 결과는 짧은 hex 문자열 (sha256 hex).

"use client";

async function sha256Hex(input: string): Promise<string> {
  const enc = new TextEncoder().encode(input);
  const buf = await crypto.subtle.digest("SHA-256", enc);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function canvasFingerprint(): string {
  try {
    const canvas = document.createElement("canvas");
    canvas.width = 220;
    canvas.height = 30;
    const ctx = canvas.getContext("2d");
    if (!ctx) return "";
    ctx.textBaseline = "top";
    ctx.font = "14px 'Noto Serif KR', serif";
    ctx.fillStyle = "#102040";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#FFE08A";
    ctx.fillText("밤하늘의 별 ★ 0123 abc", 2, 2);
    return canvas.toDataURL().slice(-64);
  } catch {
    return "";
  }
}

/** localStorage 보존 + 디바이스 signal 결합한 fingerprint. */
export async function getClientFingerprint(): Promise<string> {
  const LS_KEY = "we.are.star.fp.v1";

  // localStorage 키 우선 (브라우저 재시작에도 유지)
  let lsKey: string;
  try {
    lsKey = localStorage.getItem(LS_KEY) || "";
    if (!lsKey) {
      lsKey = crypto.randomUUID();
      localStorage.setItem(LS_KEY, lsKey);
    }
  } catch {
    lsKey = "no-ls";
  }

  const signals = [
    lsKey,
    navigator.userAgent,
    navigator.language,
    (navigator.languages || []).join(","),
    String(screen.width),
    String(screen.height),
    String(screen.colorDepth),
    Intl.DateTimeFormat().resolvedOptions().timeZone || "",
    String(navigator.hardwareConcurrency || 0),
    canvasFingerprint(),
  ].join("|");

  return await sha256Hex(signals);
}
