-- 비속어 시드 사전
-- "normalized" 는 src/lib/profanity/normalize.ts 의 normalizeForFilter 결과와 동일해야 한다.
-- 즉 NFD → 호환 자모 → 자모/라틴만 남김 → 연속 동일 문자 압축까지 적용한 값.
--
-- 시드 정책:
--   1) 1음절 일반 명사(년/놈)는 오탐 압도적이므로 제외. 합성어로만 차단.
--   2) 영문 음역(shibal/sibal/byungshin 등)도 등록.
--   3) 시드 변경 시 정상 한국어 한 줄을 차단하지 않는지 항상 점검.

-- 과거 시드에 잘못 들어있던 1음절 일반어 제거
DELETE FROM banned_words WHERE raw IN ('년', '놈');

-- 정규화 규칙 변경(연속 자모 압축) 으로 normalized 가 달라진 시드 재정렬:
-- 'normalized' 가 dedup 적용된 형태로 바뀌었으므로 기존 행을 모두 지우고 새로 시드.
TRUNCATE banned_words;

INSERT INTO banned_words (raw, normalized, category) VALUES
  -- ── profanity (한글) ──────────────────────────────────────────────
  ('시발',     'ㅅㅣㅂㅏㄹ',         'profanity'),
  ('씨발',     'ㅆㅣㅂㅏㄹ',         'profanity'),
  ('시바',     'ㅅㅣㅂㅏ',           'profanity'),
  ('씨바',     'ㅆㅣㅂㅏ',           'profanity'),
  ('병신',     'ㅂㅕㅇㅅㅣㄴ',       'profanity'),
  ('새끼',     'ㅅㅐㄲㅣ',           'profanity'),
  ('미친',     'ㅁㅣㅊㅣㄴ',         'profanity'),
  ('지랄',     'ㅈㅣㄹㅏㄹ',         'profanity'),
  ('좆',       'ㅈㅗㅈ',             'profanity'),
  ('존나',     'ㅈㅗㄴㅏ',           'profanity'),  -- ㄴㄴ→ㄴ
  ('느금마',   'ㄴㅡㄱㅡㅁㅏ',       'profanity'),  -- ㅁㅁ→ㅁ
  ('니애미',   'ㄴㅣㅇㅐㅁㅣ',       'profanity'),
  ('개새끼',   'ㄱㅐㅅㅐㄲㅣ',       'profanity'),
  ('호로새끼', 'ㅎㅗㄹㅗㅅㅐㄲㅣ',   'profanity'),
  ('썅',       'ㅆㅑㅇ',             'profanity'),
  ('썅놈',     'ㅆㅑㅇㄴㅗㅁ',       'profanity'),
  ('썅년',     'ㅆㅑㅇㄴㅕㄴ',       'profanity'),
  ('개놈',     'ㄱㅐㄴㅗㅁ',         'profanity'),
  ('미친놈',   'ㅁㅣㅊㅣㄴㅗㅁ',     'profanity'),  -- ㄴㄴ→ㄴ
  ('미친년',   'ㅁㅣㅊㅣㄴㅕㄴ',     'profanity'),  -- ㄴㄴ→ㄴ
  ('엿먹어',   'ㅇㅕㅅㅁㅓㄱㅇㅓ',   'profanity'),
  -- ── profanity (영문 음역) ─────────────────────────────────────────
  ('shibal',     'shibal',     'profanity'),
  ('sibal',      'sibal',      'profanity'),
  ('shiba',      'shiba',      'profanity'),
  ('siba',       'siba',       'profanity'),
  ('byungshin',  'byungshin',  'profanity'),
  ('byungsin',   'byungsin',   'profanity'),
  ('jonna',      'jona',       'profanity'),     -- nn→n
  ('jonman',     'jonman',     'profanity'),
  ('jiral',      'jiral',      'profanity'),
  ('gaesaekki',  'gaesaeki',   'profanity'),     -- kk→k
  ('gaesekki',   'gaeseki',    'profanity'),     -- kk→k
  ('michinnom',  'michinom',   'profanity'),     -- nn→n
  ('michinnyon', 'michinyon',  'profanity'),     -- nn→n
  -- ── sexual ────────────────────────────────────────────────────────
  ('섹스',     'ㅅㅔㄱㅅㅡ',         'sexual'),
  ('자위',     'ㅈㅏㅇㅟ',           'sexual'),
  ('야동',     'ㅇㅑㄷㅗㅇ',         'sexual'),
  ('야사',     'ㅇㅑㅅㅏ',           'sexual'),
  -- ── hate ──────────────────────────────────────────────────────────
  ('한남',     'ㅎㅏㄴㅏㅁ',         'hate'),       -- ㄴㄴ→ㄴ
  ('한녀',     'ㅎㅏㄴㅕ',           'hate'),       -- ㄴㄴ→ㄴ
  ('짱깨',     'ㅉㅏㅇㄲㅐ',         'hate'),
  ('쪽바리',   'ㅉㅗㄱㅂㅏㄹㅣ',     'hate'),
  ('틀딱',     'ㅌㅡㄹㄸㅏㄱ',       'hate'),
  ('급식충',   'ㄱㅡㅂㅅㅣㄱㅊㅜㅇ', 'hate')
ON CONFLICT (normalized) DO NOTHING;
