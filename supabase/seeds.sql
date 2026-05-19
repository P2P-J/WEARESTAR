-- 비속어 시드 사전
-- "normalized" 는 src/lib/profanity/normalize.ts 의 정규화와 동일 규칙으로 만들어야 함.
-- 정규화: NFD 분해 → 영문 소문자 → 숫자→자모 치환 → 공백/특수문자 제거 → 자모만 남김
--
-- 시드는 의도적으로 짧게 시작하고, /admin 또는 SQL 에디터로 추가.
-- ※ 이 파일은 한국에서 가장 흔히 차단되는 욕설 핵심만 담는다.
--   사전을 확장할 때는 별도 마이그레이션으로 관리할 것.

INSERT INTO banned_words (raw, normalized, category) VALUES
  -- profanity (욕설 핵심)
  ('시발',     'ㅅㅣㅂㅏㄹ',     'profanity'),
  ('씨발',     'ㅆㅣㅂㅏㄹ',     'profanity'),
  ('시바',     'ㅅㅣㅂㅏ',       'profanity'),
  ('씨바',     'ㅆㅣㅂㅏ',       'profanity'),
  ('병신',     'ㅂㅕㅇㅅㅣㄴ',   'profanity'),
  ('새끼',     'ㅅㅐㄲㅣ',       'profanity'),
  ('미친',     'ㅁㅣㅊㅣㄴ',     'profanity'),
  ('지랄',     'ㅈㅣㄹㅏㄹ',     'profanity'),
  ('좆',       'ㅈㅗㅈ',         'profanity'),
  ('존나',     'ㅈㅗㄴㄴㅏ',     'profanity'),
  ('느금마',   'ㄴㅡㄱㅡㅁㅁㅏ', 'profanity'),
  ('니애미',   'ㄴㅣㅇㅐㅁㅣ',   'profanity'),
  ('개새끼',   'ㄱㅐㅅㅐㄲㅣ',   'profanity'),
  ('호로새끼', 'ㅎㅗㄹㅗㅅㅐㄲㅣ','profanity'),
  ('썅',       'ㅆㅑㅇ',         'profanity'),
  ('썅놈',     'ㅆㅑㅇㄴㅗㅁ',   'profanity'),
  ('썅년',     'ㅆㅑㅇㄴㅕㄴ',   'profanity'),
  ('년',       'ㄴㅕㄴ',         'profanity'),
  ('놈',       'ㄴㅗㅁ',         'profanity'),
  ('엿먹어',   'ㅇㅕㅅㅁㅓㄱㅇㅓ','profanity'),
  -- sexual (성적)
  ('섹스',     'ㅅㅔㄱㅅㅡ',     'sexual'),
  ('자위',     'ㅈㅏㅇㅟ',       'sexual'),
  ('야동',     'ㅇㅑㄷㅗㅇ',     'sexual'),
  ('야사',     'ㅇㅑㅅㅏ',       'sexual'),
  -- hate (혐오)
  ('한남',     'ㅎㅏㄴㄴㅏㅁ',   'hate'),
  ('한녀',     'ㅎㅏㄴㄴㅕ',     'hate'),
  ('짱깨',     'ㅉㅏㅇㄲㅐ',     'hate'),
  ('쪽바리',   'ㅉㅗㄱㅂㅏㄹㅣ', 'hate'),
  ('틀딱',     'ㅌㅡㄹㄸㅏㄱ',   'hate'),
  ('급식충',   'ㄱㅡㅂㅅㅣㄱㅊㅜㅇ','hate')
ON CONFLICT (normalized) DO NOTHING;
