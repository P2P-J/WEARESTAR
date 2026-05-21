# 밤하늘의 별 · We Are Star

> **매일 자정, 새 일기장이 열린다. 단 열 사람만 한 줄을 남길 수 있다.**

🌌 **Live →** [wearestar-git-main-p2p-js-projects.vercel.app](https://wearestar-git-main-p2p-js-projects.vercel.app)

이름도 닉네임도 없이, 시각만 남기고 가는 익명 공동 일기장.
누가 다녀갔는지는 영원히 모르지만, 그날 누군가가 거기 있었다는 흔적만 남는다.

---

## 어떻게 작동하는가

- 한국 시간(KST) 자정 정각에 새로운 일기장이 열린다. 빈 칸 10개.
- 누구든 들어와서, 로그인·닉네임 없이, **150자 안에 한 줄**을 남길 수 있다.
- 10칸이 차면 그날은 닫힌다. 11번째로 온 사람은 읽기만 가능.
- 한 사람은 **하루 한 줄만** (브라우저 fingerprint 기반 식별).
- **댓글·좋아요·팔로우는 없다.** 반응할 수 있는 건 오직 읽는 것 — 그리고 부적절할 땐 신고.
- 신고 3회 누적 시 자동으로 가려진다. 칸 자체는 사라지지 않는다 — 그것도 그날의 흔적이니까.

지난 일기장들은 무한 스크롤로 펼쳐서 한 권의 두루마리처럼 넘겨볼 수 있다.

---

## 보이지 않게 작동하는 것들

이 사이트는 단순해 보이지만, 몇 가지를 정확히 지켜야 컨셉이 무너지지 않는다.

| 약속 | 어떻게 지키나 |
|---|---|
| 자정 정확히 새 일기장이 열린다 | KST 하드코딩, DST 없음. `src/lib/day/time.ts` 가 시간 계산의 단일 진실 |
| 11번째 작성이 절대 들어가지 않는다 | `claim_slot` RPC + `FOR UPDATE` 락 + `UNIQUE(day_id, slot_number)` 제약 |
| 한 사람이 하루에 두 줄 못 남긴다 | `UNIQUE(day_id, author_hash)` + RPC 안에서 이중 체크 |
| 같은 사람을 날짜 너머로 추적할 수 없다 | `author_hash = sha256(fingerprint ‖ day_id ‖ SERVER_SECRET)` → 일자별로 해시가 달라짐. DB 에서도, 클라이언트 전송에서도 어디로도 나가지 않음 |
| 비속어가 새어 나가지 않는다 | NFD + 호환 자모 + 숫자 치환 + 연속 자모 압축. `시1발`, `시 발`, `씨이바알` 같은 우회 패턴 차단 |
| 신고 누적 가려진 글의 원문이 응답으로 새지 않는다 | DB 안엔 보존(관리자 복구용), 클라이언트 전송 시 서버에서 마스킹 placeholder 로 치환 |

자세한 invariant 검토는 [`CLAUDE.md`](./CLAUDE.md) 참고.

---

## 스택

| 영역 | 선택 |
|---|---|
| 프레임워크 | Next.js 15 App Router · TypeScript |
| 스타일 | Tailwind CSS · framer-motion |
| 폰트 | Noto Serif KR (한글) · Inter (영문 라벨) |
| DB | **Neon** Postgres (`@neondatabase/serverless` HTTP) |
| 배포 | Vercel (자동 배포: main 푸시 → 빌드) |
| 인증 | Admin 단일 비밀번호 + HMAC 쿠키 토큰 + brute-force lock |

---

## 빠르게 시작하기

```bash
# 1. 의존성 설치
npm install

# 2. Neon 프로젝트 만들기
#    https://console.neon.tech → New Project (Postgres 17, Asia/Tokyo 또는 Singapore)
#    Connection string 복사: postgresql://USER:PASS@HOST/DB?sslmode=require

# 3. 환경변수
cp .env.example .env.local
# .env.local 안에 DATABASE_URL, SERVER_SECRET, ADMIN_PASSWORD, SITE_LAUNCH_DATE 입력

# 4. DB 스키마 + 비속어 시드 자동 적용
npm run db:apply

# 5. 개발 서버
npm run dev
# http://localhost:3000
```

> `DATABASE_URL` 이 비어있어도 데모 데이터로 UI 만 확인 가능. 쓰기 / 신고 / 관리자는 DB 필요.

---

## 환경변수

| 키 | 설명 |
|---|---|
| `DATABASE_URL` | Neon Postgres connection string (`?sslmode=require` 권장) |
| `SERVER_SECRET` | `author_hash` 솔트 + admin 쿠키 HMAC 키. **16자 이상 랜덤 문자열** (예: `openssl rand -hex 32`) |
| `ADMIN_PASSWORD` | `/admin` 비밀번호 |
| `SITE_LAUNCH_DATE` | D+1 기준일 (KST `YYYY-MM-DD`). 이 날짜 이전엔 OPENING SOON 카운트다운 표시 |
| `NEXT_PUBLIC_SITE_URL` | (선택) 배포 URL — OG 메타 + admin 로그아웃 리다이렉트 |

---

## 라우트

| 경로 | 설명 |
|---|---|
| `/` | 오늘의 일기장 — 한 줄 남기기 + 별자리 보기 (D+1 이전엔 카운트다운) |
| `/d/[n]` | D+N 페이지 — 특정 날짜 직접 링크 (공유용) |
| `/archive` | 아카이브 — 무한 수직 스크롤로 과거 일기장 펼쳐보기 |
| `/admin` | 관리자 — 신고 누적·가려진·삭제된 글 검토 / 복구 / 삭제 |

---

## 아키텍처 한눈에

```
Next.js (App Router · Vercel)
  ├─ Server Components   : 페이지 데이터 SSR
  ├─ Server Actions      : writeEntry / reportEntry / adminLogin / adminSetEntryFlags
  └─ Client Components   : TodayBoard · WriteModal · Constellation · ArchiveStream …

Neon Postgres
  ├─ tables  : days · star_positions · entries · reports · banned_words · admin_login_attempts
  ├─ RPC     : claim_slot · report_entry · ensure_day
  └─ access  : @neondatabase/serverless 의 neon() — HTTP 단일 SQL 호출
```

쓰기 경로 한 줄 요약:

```
[Client] WriteModal
   ↓ (Server Action)
[Server] writeEntry()
   ├─ 비속어 정규화 + banned_words substring 매칭
   ├─ ensureDayByDate()        ← lazy: 그날 days 행이 없으면 생성 + 별 좌표 시드
   ├─ author_hash 계산          ← 일자별 솔팅
   └─ claim_slot RPC            ← FOR UPDATE 락 + UNIQUE 제약으로 11번째 차단
        ↓ 성공 시
[Client] rising 애니메이션 + router.refresh()
```

---

## 비속어 필터

`src/lib/profanity/normalize.ts` 가 입력을 다음 순서로 정규화한 뒤 `banned_words.normalized` 와 substring 매칭한다.

1. NFC 정규화 + 소문자
2. 숫자 / 유사 문자 치환: `0→ㅇ`, `1→ㅣ`, `3→ㅔ`, `7→ㄱ`, `@→ㅇ`, `$→ㅅ`
3. NFD 분해
4. 호환 자모(U+3131~) 로 변환
5. 자모 / 라틴 외 모두 제거 (공백·특수문자·이모지·숫자)
6. **연속 동일 문자 압축** (`(.)\1+ → $1`)

이렇게 하면 다음이 모두 같은 정규화 결과를 갖는다:

```
시발 · 시 발 · 시1발 · 시ㅂㅏㄹ · 씨이바알 · ㅅㅣㅂㅏㄹ
                        ↓
                  ㅅㅣㅂㅏㄹ
```

사전(`db/seeds.sql`) 은 한국어 비속어 + 영문 음역(shibal/sibal/byungshin 등) 44개로 시작.
1음절 일반명사(년 / 놈)는 오탐이 압도적이라 합성어(미친년, 개놈 등) 형태로만 등록.

---

## 폴더 구조

```
src/
  app/
    layout.tsx · globals.css · icon.svg
    page.tsx                # /
    archive/page.tsx        # /archive
    d/[n]/page.tsx          # /d/[n]
    admin/page.tsx          # /admin
    admin/logout/route.ts   # POST only (CSRF 방지)
  components/
    Star · Constellation · TitleBlock · StatsRow · PageHeader · Countdown · Footer
    WriteModal · ReportPopover · TodayBoard · ReadOnlyBoard · ComingSoon
    DayBoardSection · ArchiveStream · AdminLoginForm · AdminPanel
  lib/
    db/client.ts                       # Neon serverless (neon())
    fingerprint/client.ts · server.ts  # 브라우저 fingerprint + author_hash
    day/time.ts · positions.ts         # KST 시간 + 별자리 좌표 PRNG
    profanity/normalize.ts             # 한국어 정규화
    actions/write.ts · report.ts · admin.ts · archive.ts · me.ts
    data/day-bundle.ts                 # SSR 페이지 데이터 로더
    types.ts
db/
  schema.sql · seeds.sql               # npm run db:apply 로 한 번에 적용
scripts/
  apply-schema.mjs                     # 스키마 + 시드 적용
  wipe-days.mjs                        # days TRUNCATE CASCADE (개발용)
```

---

## 운영 메모

- 매일 자정 새 일기장은 **첫 작성자가 진입할 때 lazy 생성**된다. 별도 크론 없음.
- 운영 중 `npm run db:wipe-days` 는 절대 쓰지 말 것 — 모든 entries 가 CASCADE 로 사라진다.
- 비속어 사전 확장은 `db/seeds.sql` 갱신 후 `npm run db:apply` 재실행.
  단, `normalized` 컬럼 값은 `normalizeForFilter` 의 출력과 정확히 같아야 함.
- 관리자 로그인 5회 실패 시 IP 해시 기준 15분간 잠금. 잠겼다면 `admin_login_attempts` 에서 직접 정리 가능.

---

## 라이선스

[MIT](./LICENSE)
