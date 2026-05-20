# 밤하늘의 별 — 프로젝트 노트

## 컨셉 (변하지 않는 핵심)

- 매일 자정 KST에 새 일기장이 열린다. 10개의 빈 칸.
- 누구든 들어와서, 닉네임 없이, 150자 안에 한 줄을 남긴다.
- 10칸이 차면 그날은 닫힌다. 11번째는 읽기만 가능.
- 같은 사람은 하루 한 줄만 (브라우저 fingerprint 기반).
- **댓글·좋아요·팔로우 없음.** 반응할 수 있는 건 오직 읽는 것뿐.
- 그러므로 이 사이트가 깨지는 것은 어뷰징이다. 비속어 사전 + 신고 시스템이 1차 방어선.

## 보이지 않는 곳에서 작동해야 하는 것

- 자정 정확히 새 일기장이 열린다 (KST 하드코딩, DST 없음).
- 11번째 작성이 절대 들어가지 않는다 (`claim_slot` RPC, `FOR UPDATE` 락, `UNIQUE` 제약).
- 비속어가 새어 나가지 않는다 (NFD + 호환 자모 + 숫자 치환 정규화).
- 사람을 날짜 너머로 추적할 수 없다 (`author_hash`는 `day_id`로 솔팅 → 다음 날 다른 해시).

## 작업할 때 지킬 것

- DB 는 Neon Postgres. 클라이언트는 `@neondatabase/serverless` 의 HTTP `neon(...)` 함수 (`src/lib/db/client.ts`). Tagged template literal 로 호출하면 자동 파라미터 바인딩.
- 시간 계산은 절대 `new Date()` 만으로 비교하지 말고 `src/lib/day/time.ts` 의 `todayKstDate()` 등을 거친다.
- 슬롯/신고는 직접 `entries`/`reports`에 INSERT 하지 말고 RPC (`claim_slot`, `report_entry`) 경유한다 — 동시성과 멱등성이 거기 있다.
- `banned_words` 정규화는 `normalizeForFilter` 와 항상 같은 규칙으로 만든다. 시드 추가 시 다음 형식 유지:
  - raw: 원본 ("시발")
  - normalized: NFD → 호환 자모 ("ㅅㅣㅂㅏㄹ") · `src/lib/profanity/normalize.ts` 함수의 출력과 동일하게.
- 새 페이지를 만들면 `force-dynamic` + `revalidate = 0` 을 의식한다 (캐시되면 오늘 데이터가 갱신 안 됨).

## 디자인 원칙

- 시끄러우면 컨셉이 무너진다. 모션은 별이 떠오를 때 한 번, 카운트다운 갱신, 호버 살짝 — 그게 전부.
- 색은 4개뿐: 별의 노란(`--star`), 내 별의 핑크(`--star-mine`), 빈 자리 회색(`--star-ghost`), 잉크 크림(`--ink`).
- 한국어는 Noto Serif KR, 영문 라벨/숫자는 Inter (mono).

## 커밋 규칙

- 글로벌 규칙대로 `Co-Authored-By` 라인 넣지 않는다.
- 한 커밋엔 한 가지 일. "스캐폴딩", "UI 컴포넌트", "RPC 작성" 같이 분리.
