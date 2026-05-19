-- 밤하늘의 별 (We Are Star) — Supabase schema
-- Supabase Dashboard > SQL Editor 에서 실행

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
  day_id       BIGINT REFERENCES days(id) ON DELETE CASCADE,
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
  day_id          BIGINT REFERENCES days(id) ON DELETE CASCADE,
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
  entry_id      BIGINT REFERENCES entries(id) ON DELETE CASCADE,
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
-- 6. RPC: 슬롯 확보 (트랜잭션 안에서 11번째 차단)
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
BEGIN
  -- Lock the day row to serialize concurrent writers
  PERFORM 1 FROM days WHERE id = p_day_id FOR UPDATE;

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
-- 7. RPC: 신고 (3회 누적 시 가림)
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
BEGIN
  INSERT INTO reports (entry_id, reporter_hash, reason)
  VALUES (p_entry_id, p_reporter_hash, p_reason)
  ON CONFLICT DO NOTHING;

  UPDATE entries
    SET report_count = (SELECT COUNT(*) FROM reports WHERE entry_id = p_entry_id),
        is_hidden    = CASE WHEN (SELECT COUNT(*) FROM reports WHERE entry_id = p_entry_id) >= 3
                            THEN TRUE ELSE is_hidden END
    WHERE id = p_entry_id
    RETURNING report_count, is_hidden INTO v_count, v_hidden;

  RETURN QUERY SELECT v_count, v_hidden;
END;
$$;

-- ────────────────────────────────────────────────────────────────────────────
-- 8. RPC: 일자 + 별자리 보장 (lazy create)
-- ────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION ensure_day(
  p_date_kst   DATE,
  p_day_number INT,
  p_positions  JSONB    -- [{slot:1,x:..,y:..}, ...]
)
RETURNS BIGINT
LANGUAGE plpgsql
AS $$
DECLARE
  v_id BIGINT;
  v_opens  TIMESTAMPTZ;
  v_closes TIMESTAMPTZ;
BEGIN
  SELECT id INTO v_id FROM days WHERE date_kst = p_date_kst;
  IF FOUND THEN
    RETURN v_id;
  END IF;

  v_opens  := (p_date_kst::text || ' 00:00:00 Asia/Seoul')::timestamptz;
  v_closes := v_opens + INTERVAL '1 day';

  INSERT INTO days (day_number, date_kst, opens_at, closes_at)
  VALUES (p_day_number, p_date_kst, v_opens, v_closes)
  ON CONFLICT (date_kst) DO UPDATE SET date_kst = EXCLUDED.date_kst
  RETURNING id INTO v_id;

  -- 좌표 시드
  INSERT INTO star_positions (day_id, slot_number, x_pct, y_pct)
  SELECT v_id,
         (elem->>'slot')::SMALLINT,
         (elem->>'x')::NUMERIC,
         (elem->>'y')::NUMERIC
  FROM jsonb_array_elements(p_positions) elem
  ON CONFLICT DO NOTHING;

  RETURN v_id;
END;
$$;

-- ────────────────────────────────────────────────────────────────────────────
-- 9. Row Level Security
-- ────────────────────────────────────────────────────────────────────────────
ALTER TABLE days            ENABLE ROW LEVEL SECURITY;
ALTER TABLE star_positions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE entries         ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports         ENABLE ROW LEVEL SECURITY;
ALTER TABLE banned_words    ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS days_read       ON days;
DROP POLICY IF EXISTS positions_read  ON star_positions;
DROP POLICY IF EXISTS entries_read    ON entries;
DROP POLICY IF EXISTS reports_block   ON reports;
DROP POLICY IF EXISTS banned_block    ON banned_words;

CREATE POLICY days_read      ON days            FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY positions_read ON star_positions  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY entries_read   ON entries         FOR SELECT TO anon, authenticated USING (is_deleted = false);

-- 쓰기는 service_role 에서만. anon은 RPC 경유 (RPC는 SECURITY DEFINER가 아니므로 service_role로 호출).

-- ────────────────────────────────────────────────────────────────────────────
-- 10. 비속어 시드 (정규화된 형태로 저장 — 자모분해 후 자모 시퀀스)
-- ────────────────────────────────────────────────────────────────────────────
-- 시드는 별도 SQL (seeds.sql) 로 분리.
