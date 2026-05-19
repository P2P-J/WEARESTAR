# 밤하늘의 별 (We Are Star)

매일 자정, 새 일기장이 열린다. 단 열 사람만 한 줄을 남길 수 있다.

- 로그인 없음, 닉네임 없음. 시각(HH:MM)만 남는다.
- 하루 10명만, 1인 1줄, 150자 이내.
- 신고 3회 누적 시 자동 가림. 관리자가 수동 검토/삭제.
- KST(Asia/Seoul) 기준 자정에 새 일기장 오픈.

## 스택

Next.js 15 (App Router) · TypeScript · Tailwind CSS · Supabase (PostgreSQL) · framer-motion · Vercel 배포

## 빠르게 시작하기

```bash
# 1. 의존성 설치
npm install

# 2. 환경변수 채우기
cp .env.example .env.local
# .env.local 안에 Supabase URL/Keys, SERVER_SECRET, ADMIN_PASSWORD, SITE_LAUNCH_DATE 입력

# 3. Supabase 스키마 적용 — Supabase Dashboard > SQL Editor 에서 순서대로 실행
#   - supabase/schema.sql
#   - supabase/seeds.sql

# 4. 개발 서버
npm run dev
# http://localhost:3000
```

> Supabase 환경변수가 비어있어도 개발용 데모 데이터로 UI는 보입니다 (`/`). 쓰기/신고/관리자는 Supabase가 필요.

## 환경변수

| 키 | 설명 |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon public key |
| `SUPABASE_SERVICE_ROLE_KEY` | service role key (RPC 호출용, 서버에만 노출) |
| `SERVER_SECRET` | author_hash 솔트. 16자 이상 랜덤 문자열 |
| `ADMIN_PASSWORD` | `/admin` 비밀번호 |
| `SITE_LAUNCH_DATE` | D+1 기준일 (KST `YYYY-MM-DD`) |

## 라우트

- `/` 오늘의 일기장 — 한 줄 남기기 + 별자리 보기
- `/d/[n]` D+N 페이지 — 특정 날짜로 직접 링크
- `/archive` 아카이브 — 과거 일기장을 무한 스크롤로 펼치기
- `/admin` 신고/가림/삭제 관리

## 아키텍처 한눈에

```
Next.js (App Router · Vercel)
  ├ Server Components: 페이지 데이터 로드
  ├ Server Actions:    writeEntry / reportEntry / adminLogin / adminSetEntryFlags
  └ Client Components: TodayBoard / WriteModal / ArchiveStream …

Supabase (PostgreSQL)
  ├ tables:      days · star_positions · entries · reports · banned_words
  ├ RPC:         claim_slot / report_entry / ensure_day
  └ RLS:         읽기 anon, 쓰기 service_role (Server Action 경유)
```

## 동시성 / 익명성

- 10번째까지만 INSERT, 11번째는 `day_full` 거절 → `claim_slot` RPC가 `FOR UPDATE` 락 + `UNIQUE(day_id, slot_number)` 보장.
- 1인 1줄 → `UNIQUE(day_id, author_hash)` + RPC에서 이중 체크.
- `author_hash = sha256(clientFp + day_id + SERVER_SECRET)` — 일자별로 달라져서 다음 날엔 같은 사람도 다른 해시.

## 비속어 필터

- `src/lib/profanity/normalize.ts` — NFC → 숫자 치환 → NFD 분해 → 호환 자모 변환 → 자모/라틴만 남김.
- 사전(`banned_words` 테이블) 시드 → 시각/자모 우회 패턴까지 substring 매칭.
- 신고 누적(3회)으로 가려진 글은 `🤍 (가려진 글)`로 표시 (칸 자체는 사라지지 않음 — 그날의 흔적이니까).

## 폴더 구조

```
src/
  app/
    layout.tsx · globals.css
    page.tsx                # /
    archive/page.tsx        # /archive
    d/[n]/page.tsx          # /d/[n]
    admin/page.tsx          # /admin
    admin/logout/route.ts
  components/
    Star · Constellation · TitleBlock · StatsRow · PageHeader · Countdown · Footer
    WriteModal · ReportPopover · TodayBoard · ReadOnlyBoard
    DayBoardSection · ArchiveStream · AdminLoginForm · AdminPanel
  lib/
    supabase/server.ts
    fingerprint/client.ts · server.ts
    day/time.ts · positions.ts
    profanity/normalize.ts
    actions/write.ts · report.ts · admin.ts · archive.ts · me.ts
    data/day-bundle.ts
    types.ts
supabase/
  schema.sql · seeds.sql
docs/superpowers/specs/
  2026-05-19-wearestar-design.md
```
