# 밤하늘의 별 (We Are Star) — Design Spec

매일 자정 새로 열리는, 단 10명만 한 줄을 남길 수 있는 익명 일기장.

## 결정 사항

| 항목 | 결정 |
|---|---|
| 스택 | Next.js 15 App Router · TypeScript · Tailwind CSS · Supabase Postgres |
| 폰트 | Noto Serif KR (본문/타이틀) · Inter (영문 라벨) |
| 글쓰기 | 자동 슬롯 배정 + 별 떠오르는 애니메이션 (framer-motion) |
| 모더레이션 | 한국어 비속어 사전 + 자모분리/숫자치환 정규화 (외부 AI X) |
| 아카이브 | 무한 수직 스크롤 + `/d/[n]` 직접 링크 |
| Admin | 환경변수 비밀번호 1개 |
| 시간대 | Asia/Seoul 하드코딩 |
| 익명성 | client fingerprint + 일자별 server hash |

## 데이터 모델

- `days(id, day_number, date_kst, opens_at, closes_at)` — 일자 메타
- `star_positions(day_id, slot_number 1~10, x_pct, y_pct)` — 별자리 좌표 (시드: day_number)
- `entries(id, day_id, slot_number, content ≤150자, author_hash, created_at, report_count, is_hidden, is_deleted)`
  - `UNIQUE(day_id, slot_number)` · `UNIQUE(day_id, author_hash)`
- `reports(entry_id, reporter_hash, reason)` — `UNIQUE(entry_id, reporter_hash)`
- `banned_words(normalized, raw, category)`

## 핵심 RPC

```sql
claim_slot(p_day_id, p_author_hash, p_content)
  → SELECT 1 FROM days WHERE id=... FOR UPDATE
  → 중복 작성자 거절 (already_written)
  → 빈 슬롯 1~10 중 최솟값 찾기
  → 없으면 거절 (day_full)
  → INSERT entries 반환
```

## Fingerprint → author_hash

```
client_fp = sha256(canvas + UA + screen + tz + lang + hardware)
author_hash = sha256(client_fp + day_id + SERVER_SECRET)
```
같은 사람도 다음 날엔 다른 해시. DB에서 사람 추적 불가.

## 모더레이션 정규화

1. NFC 정규화 + zero-width 제거
2. 공백/특수문자 제거
3. 숫자→글자 치환 (1→ㅣ, 0→ㅇ, 3→ㅔ 등)
4. NFD 분해해서 자모 단위 매칭
5. 비속어 사전(`banned_words.normalized`)과 substring 매칭

## 별자리 좌표 생성

`mulberry32(day_number)` → 10개 좌표
- X: 8-92% 사이
- Y: 30-85% 사이
- 별 사이 최소 거리 보장

## 라우트

- `/` 오늘
- `/archive` 무한 스크롤 (오늘부터 역순)
- `/d/[n]` D+N 특정 페이지 (직접 링크)
- `/admin` 관리자 (비밀번호 인증)

## 환경 변수

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SERVER_SECRET=
ADMIN_PASSWORD=
SITE_LAUNCH_DATE=2026-04-02   # D+1 기준일 (필요시 수정)
```

## 로컬 실행

```bash
npm install
cp .env.example .env.local  # 값 채우기
# Supabase 콘솔 SQL Editor에서 supabase/schema.sql 실행
npm run dev
```
