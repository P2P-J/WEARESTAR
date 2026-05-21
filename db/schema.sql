-- 밤하늘의 별 (We Are Star) — Neon Postgres schema
-- 멱등(CREATE ... IF NOT EXISTS / CREATE OR REPLACE) 이라 재실행 안전.

SET TIME ZONE 'Asia/Seoul';

-- ────────────────────────────────────────────────────────────────────────────
-- 1. 일자 메타
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS days (
  id           BIGSERIAL PRIMARY KEY,
  day_number   INT  UNIQUE NOT NULL,
  date_kst     DATE UNIQUE NOT NULL,
  opens_at     TIMESTAMPTZ NOT NULL,
  closes_at    TIMESTAMPTZ NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS days_day_number_idx ON days (day_number DESC);

-- ────────────────────────────────────────────────────────────────────────────
-- 2. 별자리 좌표 (날짜별 10개, 시드 = day_number)
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS star_positions (
  day_id       BIGINT NOT NULL REFERENCES days(id) ON DELETE CASCADE,
  slot_number  SMALLINT NOT NULL CHECK (slot_number BETWEEN 1 AND 10),
  x_pct        NUMERIC(5,2) NOT NULL,
  y_pct        NUMERIC(5,2) NOT NULL,
  PRIMARY KEY (day_id, slot_number)
);

-- ────────────────────────────────────────────────────────────────────────────
-- 3. 한 줄 일기
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS entries (
  id              BIGSERIAL PRIMARY KEY,
  day_id          BIGINT NOT NULL REFERENCES days(id) ON DELETE CASCADE,
  slot_number     SMALLINT NOT NULL CHECK (slot_number BETWEEN 1 AND 10),
  content         TEXT NOT NULL CHECK (char_length(content) BETWEEN 1 AND 150),
  author_hash     TEXT NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  report_count    INT NOT NULL DEFAULT 0,
  is_hidden       BOOLEAN NOT NULL DEFAULT false,
  is_deleted      BOOLEAN NOT NULL DEFAULT false,
  UNIQUE (day_id, slot_number),
  UNIQUE (day_id, author_hash)
);

CREATE INDEX IF NOT EXISTS entries_day_created_idx ON entries (day_id, created_at);
CREATE INDEX IF NOT EXISTS entries_reports_idx ON entries (report_count DESC) WHERE report_count > 0;

-- ────────────────────────────────────────────────────────────────────────────
-- 4. 신고
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reports (
  entry_id      BIGINT NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
  reporter_hash TEXT NOT NULL,
  reason        TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (entry_id, reporter_hash)
);

-- ────────────────────────────────────────────────────────────────────────────
-- 5. 비속어 사전
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS banned_words (
  id           BIGSERIAL PRIMARY KEY,
  normalized   TEXT UNIQUE NOT NULL,
  raw          TEXT NOT NULL,
  category     TEXT NOT NULL DEFAULT 'profanity',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ────────────────────────────────────────────────────────────────────────────
-- 6. 관리자 로그인 시도 (brute-force 방지)
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS admin_login_attempts (
  id            BIGSERIAL PRIMARY KEY,
  succeeded     BOOLEAN NOT NULL,
  source_hash   TEXT,
  attempted_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS admin_login_attempts_time_idx
  ON admin_login_attempts (attempted_at DESC)
  WHERE succeeded = false;

-- ────────────────────────────────────────────────────────────────────────────
-- 7. RPC: 슬롯 확보 (트랜잭션 안에서 11번째 차단)
-- ────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION claim_slot(
  p_day_id      BIGINT,
  p_author_hash TEXT,
  p_content     TEXT
)
RETURNS TABLE(out_slot_number SMALLINT, out_entry_id BIGINT)
LANGUAGE plpgsql
AS $$
DECLARE
  v_slot SMALLINT;
  v_id   BIGINT;
  v_day_exists BOOLEAN;
BEGIN
  -- day_id 존재 확인 + 같은 day_id에 동시 접근하는 작성자를 직렬화
  SELECT TRUE INTO v_day_exists FROM days WHERE id = p_day_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'day_not_found' USING ERRCODE = 'P0003';
  END IF;

  IF EXISTS (SELECT 1 FROM entries WHERE day_id = p_day_id AND author_hash = p_author_hash) THEN
    RAISE EXCEPTION 'already_written' USING ERRCODE = 'P0001';
  END IF;

  SELECT MIN(s) INTO v_slot
  FROM generate_series(1, 10) s
  WHERE s NOT IN (SELECT slot_number FROM entries WHERE day_id = p_day_id);

  IF v_slot IS NULL THEN
    RAISE EXCEPTION 'day_full' USING ERRCODE = 'P0002';
  END IF;

  INSERT INTO entries (day_id, slot_number, content, author_hash)
  VALUES (p_day_id, v_slot, p_content, p_author_hash)
  RETURNING id INTO v_id;

  RETURN QUERY SELECT v_slot, v_id;
END;
$$;

-- ────────────────────────────────────────────────────────────────────────────
-- 8. RPC: 신고 (3회 누적 시 가림). 본인 글 자가신고 거절.
-- ────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION report_entry(
  p_entry_id      BIGINT,
  p_reporter_hash TEXT,
  p_reason        TEXT DEFAULT NULL
)
RETURNS TABLE(out_report_count INT, out_is_hidden BOOLEAN)
LANGUAGE plpgsql
AS $$
DECLARE
  v_count INT;
  v_hidden BOOLEAN;
  v_author TEXT;
BEGIN
  SELECT author_hash INTO v_author FROM entries WHERE id = p_entry_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'entry_not_found' USING ERRCODE = 'P0004';
  END IF;
  IF v_author = p_reporter_hash THEN
    RAISE EXCEPTION 'self_report' USING ERRCODE = 'P0005';
  END IF;

  INSERT INTO reports (entry_id, reporter_hash, reason)
  VALUES (p_entry_id, p_reporter_hash, p_reason)
  ON CONFLICT DO NOTHING;

  WITH c AS (SELECT COUNT(*)::int AS n FROM reports WHERE entry_id = p_entry_id)
  UPDATE entries
    SET report_count = (SELECT n FROM c),
        is_hidden    = is_hidden OR (SELECT n FROM c) >= 3
    WHERE id = p_entry_id
    RETURNING report_count, is_hidden INTO v_count, v_hidden;

  RETURN QUERY SELECT v_count, v_hidden;
END;
$$;

-- ────────────────────────────────────────────────────────────────────────────
-- 9. RPC: 일자 + 별자리 보장 (lazy create). days 한 행을 통째로 반환.
--    이전 버전(BIGINT 반환)이 있을 수 있으니 명시적 DROP.
-- ────────────────────────────────────────────────────────────────────────────
DROP FUNCTION IF EXISTS ensure_day(DATE, INT, JSONB);

CREATE OR REPLACE FUNCTION ensure_day(
  p_date_kst   DATE,
  p_day_number INT,
  p_positions  JSONB
)
RETURNS TABLE(
  out_id          BIGINT,
  out_day_number  INT,
  out_date_kst    DATE,
  out_opens_at    TIMESTAMPTZ,
  out_closes_at   TIMESTAMPTZ
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_id BIGINT;
  v_opens  TIMESTAMPTZ;
  v_closes TIMESTAMPTZ;
BEGIN
  -- IANA 시간대 안전 캐스트
  v_opens  := (p_date_kst::timestamp) AT TIME ZONE 'Asia/Seoul';
  v_closes := v_opens + INTERVAL '1 day';

  INSERT INTO days (day_number, date_kst, opens_at, closes_at)
  VALUES (p_day_number, p_date_kst, v_opens, v_closes)
  ON CONFLICT (date_kst) DO UPDATE SET date_kst = EXCLUDED.date_kst
  RETURNING id INTO v_id;

  INSERT INTO star_positions (day_id, slot_number, x_pct, y_pct)
  SELECT v_id,
         (elem->>'slot')::SMALLINT,
         (elem->>'x')::NUMERIC,
         (elem->>'y')::NUMERIC
  FROM jsonb_array_elements(p_positions) elem
  ON CONFLICT DO NOTHING;

  RETURN QUERY
    SELECT d.id, d.day_number, d.date_kst, d.opens_at, d.closes_at
    FROM days d WHERE d.id = v_id;
END;
$$;

-- Note: Neon 직접 연결은 superuser 권한이므로 RLS 미사용.
-- 모든 쓰기는 Server Action을 통해서만 들어오고, 입력 검증은 애플리케이션 계층에서 처리.
