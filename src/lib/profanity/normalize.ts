// 한국어 비속어 정규화.
// 입력 텍스트를 자모 시퀀스로 펼쳐서, 사전(banned_words.normalized)과 동일한 형식으로 만든다.
// 같은 함수를 사전 시드 생성에도 사용 → 매칭 일치 보장.
//
// 규칙
//   1. NFC 정규화 → 소문자
//   2. 숫자/유사 문자 치환 (1→ㅣ, 0→ㅇ, 3→ㅔ, 7→ㄱ, @→ㅇ, $→ㅅ)
//   3. NFD 분해 (한글 음절 → 자모)
//   4. 조합형 자모(U+1100~) → 호환형 자모(U+3131~)
//   5. 자모/라틴 문자만 남기고 모두 제거 (공백/특수문자/숫자)
//   6. 결과: 호환형 자모 + 라틴 소문자 시퀀스

const DIGIT_SUB: Record<string, string> = {
  "0": "ㅇ",
  "1": "ㅣ",
  "3": "ㅔ",
  "7": "ㄱ",
  "@": "ㅇ",
  $: "ㅅ",
};

// 조합형 → 호환형 자모 매핑
// 초성 (U+1100~U+1112) → U+3131~
const CHOSEONG_TO_COMPAT: Record<number, string> = {
  0x1100: "ㄱ", 0x1101: "ㄲ", 0x1102: "ㄴ", 0x1103: "ㄷ", 0x1104: "ㄸ",
  0x1105: "ㄹ", 0x1106: "ㅁ", 0x1107: "ㅂ", 0x1108: "ㅃ", 0x1109: "ㅅ",
  0x110a: "ㅆ", 0x110b: "ㅇ", 0x110c: "ㅈ", 0x110d: "ㅉ", 0x110e: "ㅊ",
  0x110f: "ㅋ", 0x1110: "ㅌ", 0x1111: "ㅍ", 0x1112: "ㅎ",
};
// 중성 (U+1161~U+1175) → 호환형
const JUNGSEONG_TO_COMPAT: Record<number, string> = {
  0x1161: "ㅏ", 0x1162: "ㅐ", 0x1163: "ㅑ", 0x1164: "ㅒ", 0x1165: "ㅓ",
  0x1166: "ㅔ", 0x1167: "ㅕ", 0x1168: "ㅖ", 0x1169: "ㅗ", 0x116a: "ㅘ",
  0x116b: "ㅙ", 0x116c: "ㅚ", 0x116d: "ㅛ", 0x116e: "ㅜ", 0x116f: "ㅝ",
  0x1170: "ㅞ", 0x1171: "ㅟ", 0x1172: "ㅠ", 0x1173: "ㅡ", 0x1174: "ㅢ",
  0x1175: "ㅣ",
};
// 종성 (U+11A8~U+11C2) → 호환형
const JONGSEONG_TO_COMPAT: Record<number, string> = {
  0x11a8: "ㄱ", 0x11a9: "ㄲ", 0x11aa: "ㄳ", 0x11ab: "ㄴ", 0x11ac: "ㄵ",
  0x11ad: "ㄶ", 0x11ae: "ㄷ", 0x11af: "ㄹ", 0x11b0: "ㄺ", 0x11b1: "ㄻ",
  0x11b2: "ㄼ", 0x11b3: "ㄽ", 0x11b4: "ㄾ", 0x11b5: "ㄿ", 0x11b6: "ㅀ",
  0x11b7: "ㅁ", 0x11b8: "ㅂ", 0x11b9: "ㅄ", 0x11ba: "ㅅ", 0x11bb: "ㅆ",
  0x11bc: "ㅇ", 0x11bd: "ㅈ", 0x11be: "ㅊ", 0x11bf: "ㅋ", 0x11c0: "ㅌ",
  0x11c1: "ㅍ", 0x11c2: "ㅎ",
};

function jamoToCompat(code: number): string | null {
  if (code in CHOSEONG_TO_COMPAT) return CHOSEONG_TO_COMPAT[code];
  if (code in JUNGSEONG_TO_COMPAT) return JUNGSEONG_TO_COMPAT[code];
  if (code in JONGSEONG_TO_COMPAT) return JONGSEONG_TO_COMPAT[code];
  return null;
}

function isCompatJamo(code: number): boolean {
  return code >= 0x3131 && code <= 0x318e;
}

function isLatinLower(code: number): boolean {
  return code >= 0x61 && code <= 0x7a;
}

/**
 * 입력 문자열을 비교 가능한 정규화 시퀀스로 변환.
 * 매칭에 사용 (substring 비교).
 */
export function normalizeForFilter(input: string): string {
  if (!input) return "";

  let s = input.normalize("NFC").toLowerCase();

  // 숫자/유사 문자 치환
  s = s.replace(/[013@$7]/g, (ch) => DIGIT_SUB[ch] ?? ch);

  // NFD 분해
  s = s.normalize("NFD");

  // 자모/라틴만 남기기 + 호환형 변환
  let out = "";
  for (const ch of s) {
    const code = ch.codePointAt(0)!;
    if (isLatinLower(code)) {
      out += ch;
      continue;
    }
    if (isCompatJamo(code)) {
      out += ch;
      continue;
    }
    const mapped = jamoToCompat(code);
    if (mapped) out += mapped;
    // 그 외(공백/특수문자/숫자/이모지 등)는 제거
  }
  return out;
}

/** 정규화된 문자열 안에 사전 단어가 포함됐는지 확인 */
export function findMatchedWord(
  normalizedInput: string,
  dictionary: { normalized: string; raw: string }[]
): { raw: string; normalized: string } | null {
  for (const w of dictionary) {
    if (!w.normalized) continue;
    if (normalizedInput.includes(w.normalized)) return { raw: w.raw, normalized: w.normalized };
  }
  return null;
}
