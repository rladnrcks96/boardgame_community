# 보드게임 위키 & 커뮤니티 구현 계획

## 아키텍처 결정

| 결정 | 선택 | 이유 |
|---|---|---|
| 백엔드/DB | Supabase (Postgres + Auth) | idea.md의 원래 설계 방향을 계승. RLS로 "비로그인 사용자는 쓰기 불가" 불변 규칙을 DB 레벨에서도 강제(서버 액션 인증 체크에 이은 2차 방어선). 사이드 프로젝트 규모에 무료 티어로 충분 |
| 테스트 DB | 클라우드 Supabase 프로젝트(dev 프로젝트를 그대로 사용, 로컬 CLI+Docker 아님) | 이 머신에 Docker가 없어 로컬 Supabase를 실행할 수 없음(Docker Desktop 설치는 시스템 변경이라 보류). CLAUDE.md 테스트 원칙(mock 금지)은 유지하되, 실제 DB 대상을 클라우드 dev 프로젝트로 변경. 각 e2e 스펙은 afterEach에서 생성한 테스트 데이터를 정리해 오염을 방지. 이메일 인증 링크는 Supabase 대시보드의 Auth 로그에서 직접 확인 (로컬 Inbucket 대체) |
| 데이터 변경 방식 | Next.js Server Actions | RSC 우선 구조와 맞고 별도 API 라우트가 불필요. 입력 검증은 Zod 스키마로 서버 액션 진입점에서 수행 |
| 활동 로그(`activities`) 테이블 | 이번 계획에서 만들지 않음 | 포인트 시스템이 spec 범위 밖. 프로필 목록·업적 판정은 `reviews`/`posts`/`comments`/`game_wiki_revisions`/`post_likes`에서 직접 파생. 포인트 규칙을 설계할 때 그 시점 요구에 맞게 별도 추가 |
| 위키 본문 저장 | `games.wiki_body`(현재 값) + `game_wiki_revisions`(이력) 이중 저장 | 조회마다 "최신 리비전" 조회 없이 상세 페이지가 바로 현재 본문을 읽음. 이력은 별도 테이블에 append-only로 쌓임 |
| 평균 평점 / 태그 집계 | 캐시 없이 조회 시 `reviews`/`review_tags`에서 집계 쿼리 | 시딩 게임이 20-30개, 리뷰 수도 초기엔 적어 캐시 테이블 없이도 성능 문제 없음 |
| 업적 판정 | 각 쓰기 액션(위키 편집/리뷰/게시글/댓글/좋아요) 내부에서 "해당 유형 첫 행동인지" 직접 확인 후 지급 | 별도 배치·워커 없이 액션 하나에서 바로 완결. `user_achievements`에 unique 제약으로 중복 지급 방지 |
| 라우팅 | App Router 파일 기반 — 아래 파일 구조 참고 | wireframe의 10개 화면에 1:1 매핑 |
| BGG 시딩 실행 | 1회성 스크립트(`bun run seed:games`)를 수동 실행, 관리자 UI 없음 | 20-30개 게임을 반복 시딩할 빈도가 낮은 사이드 프로젝트 규모 |

### 라우트 구조

```
/                              메인 페이지 (그리드 + 검색)
/signup                        회원가입
/login                         로그인
/games/[id]                    게임 상세 (위키/리뷰 서브탭)
/games/[id]/edit                위키 편집
/games/[id]/reviews/new         리뷰 작성/수정
/games/[id]/board                게시판 (카테고리 쿼리 파라미터)
/games/[id]/board/new            게시글 작성
/games/[id]/board/[postId]       게시글 상세 (댓글 + 좋아요)
/profile                        프로필
```

## 인프라 리소스

| 리소스 | 유형 | 선언 위치 | 생성 Task |
|---|---|---|---|
| Supabase 프로젝트 (클라우드, dev/test 겸용 단일 프로젝트) | Postgres + Auth | `.env.local` (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`) | **Task 1 이전 — 사용자가 직접 생성**. Claude Code가 클라우드 계정을 만들 수 없음 |
| Supabase CLI | 로컬 도구 (마이그레이션 관리용, Docker 불필요 — `supabase link`+`supabase db push`만 사용) | 전역 설치 또는 devDependency | Task 1 이전 |
| 회원가입 인증 메일 발송 | Supabase Auth 기본 제공 SMTP | Supabase 대시보드 Auth 설정 (기본값 그대로 사용) | Task 1 이전 (Supabase 프로젝트 생성 시 자동 포함) |
| BGG XML API2 | 외부 API — **보류**: 2025-07-02 정책 변경으로 비상업 사용도 애플리케이션 등록+Bearer 토큰 승인 필요(수일~1주). 사용자가 신청 완료, 승인 대기 중 | 승인 후 시딩 스크립트에 fetch 호출 추가 (후속 작업) | Task 1 (수동 데이터로 대체), 승인 후 별도 후속 Task |

## 데이터 모델

### profiles
- id (= auth.users.id)
- nickname (unique)
- created_at

### games
- id
- bgg_id (unique)
- name
- image_url
- min_players, max_players
- playtime_min, playtime_max
- difficulty
- categories → string[]
- bgg_rank
- wiki_body (nullable)

### game_wiki_revisions
- id
- game_id → games
- editor_id → profiles
- content
- created_at

### reviews
- id
- game_id → games
- user_id → profiles
- rating (1-5)
- body
- created_at, updated_at
- unique(game_id, user_id)

### tags (고정 시드 데이터, 14개)
- id
- name
- category ('mechanic' | 'experience')

### review_tags
- review_id → reviews
- tag_id → tags
- (복합 PK)

### posts
- id
- game_id → games
- author_id → profiles
- category ('strategy' | 'variant' | 'meetup')
- title
- body
- created_at

### comments
- id
- post_id → posts
- author_id → profiles
- body
- created_at

### post_likes
- post_id → posts
- user_id → profiles
- (복합 PK — 존재 여부가 좋아요 상태)

### achievements (고정 시드 데이터, 5개)
- id
- key ('first_wiki_edit' | 'first_review' | 'first_post' | 'first_comment' | 'first_post_liked')
- label

### user_achievements
- user_id → profiles
- achievement_id → achievements
- earned_at
- (복합 PK)

## 필요 스킬

| 스킬 | 적용 Task | 용도 |
|---|---|---|
| shadcn | Task 1, 5, 6, 7, 8, 11 | 미설치 컴포넌트(tabs, avatar, sonner) 추가, 기존 컴포넌트 조합 규칙 준수 |
| next-best-practices | 전체 Task | App Router 파일 컨벤션, Server Actions, 비동기 API 패턴 |
| vercel-react-best-practices | 전체 Task | 데이터 페칭/렌더링 성능 패턴 |
| vercel-composition-patterns | Task 5 (서브탭), Task 11 (프로필 탭) | 탭 등 컴포넌트 합성 패턴 |
| web-design-guidelines | Task 2, 3, 6, 7, 8, 9, 10, 11 (폼·인터랙션 화면) | 접근성/UX 가이드라인 준수 검토 |

## 영향 받는 파일

| 파일 경로 | 변경 유형 | 관련 Task |
|---|---|---|
| `package.json` | Modify (의존성 추가: `@supabase/supabase-js`, `@supabase/ssr`, `zod`, `fast-xml-parser`) | Task 1 |
| `app/layout.tsx` | Modify (헤더 컴포넌트, `<Toaster />` 추가) | Task 1, 6 |
| `app/page.tsx` | Modify (플레이스홀더 → 메인 페이지) | Task 1, 4 |
| `supabase/migrations/**` | New | Task 1, 6, 7, 8, 9, 10 |
| `scripts/seed-games.ts` | New | Task 1 |
| `lib/supabase/*.ts` | New (server/client 클라이언트 헬퍼) | Task 1 |
| `app/{signup,login}/**` | New | Task 2, 3 |
| `app/games/[id]/**` | New | Task 5, 6, 7, 8, 9, 10 |
| `app/profile/**` | New | Task 11 |
| `lib/achievements.ts` | New | Task 6 |
| `components/ui/{tabs,avatar,sonner}.tsx` | New (shadcn add) | Task 5, 11, 6 |
| `e2e/**` | New | 전체 Task |

## Tasks

### Task 1: 게임 시딩과 메인 페이지 랭킹 그리드 — ✅ 완료 (commit 5fa29a7)

- **담당 시나리오**: Scenario 3 (full)
- **크기**: M (5 파일)
- **의존성**: None (단, Supabase 프로젝트 env 값이 사전에 준비되어 있어야 함)
- **참조**:
  - shadcn — card, skeleton
  - next-best-practices — App Router 데이터 페칭
- **구현 대상**:
  - `supabase/migrations/0001_games.sql`
  - `lib/supabase/server.ts`, `lib/supabase/client.ts`
  - `scripts/seed-games.ts` (수동 큐레이션 데이터 20-30개를 `games` 테이블에 upsert — BGG API는 애플리케이션 등록 승인 대기 중이라 라이브 연동 대신 잘 알려진 상위권 게임을 직접 입력. 이미지는 placeholder, `bgg_rank`는 큐레이션 순서로 근사. 승인 후 실제 API로 교체하는 건 별도 후속 작업)
  - `app/page.tsx`
  - `e2e/main-page.spec.ts`
- **수용 기준**:
  - [ ] 메인 페이지 접속 → 시딩된 게임 전체가 BGG 랭킹 순으로 카드 형태로 노출
  - [ ] 아직 자체 리뷰가 없는 게임 → 평균 평점 대신 "리뷰 없음" 표시
- **검증**: Playwright e2e (`bun run test:e2e -- main-page`) — `scripts/seed-games.ts` 실행 후 로컬 Supabase 기준으로 메인 페이지 방문, 카드 개수·순서·"리뷰 없음" 문구 단언

---

### Task 2: 회원가입과 이메일 인증 — ✅ 완료 (commit 23fe7ba). 실제 이메일 발송 레이트 리밋 소진으로 "신규 이메일 가입"·"중복 이메일" 두 e2e만 검증 보류 (코드는 리뷰 완료, learnings.md 참고)

- **담당 시나리오**: Scenario 1 (full)
- **크기**: M (4 파일)
- **의존성**: Task 1 (Supabase 클라이언트 헬퍼 재사용)
- **참조**:
  - shadcn — field, input, button
  - web-design-guidelines — 폼 접근성(label, 에러 메시지 연결)
- **구현 대상**:
  - `supabase/migrations/0002_profiles.sql` (`profiles` 테이블 + `auth.users` insert 트리거로 자동 생성 — spec에 별도 닉네임 입력 화면이 없어 이메일 로컬파트로 자동 생성, 충돌 시 임의 숫자 접미사)
  - `app/signup/page.tsx`
  - `app/signup/actions.ts` (Zod 검증 + `supabase.auth.signUp`)
  - `e2e/signup.spec.ts`
- **수용 기준**:
  - [ ] 신규 이메일 + 비밀번호 입력 → 가입 완료, 인증 메일 발송 안내 표시
  - [ ] 이미 가입된 이메일로 가입 시도 → "이미 사용 중인 이메일입니다" 에러 표시
  - [ ] 인증 링크 클릭 → "인증이 완료되었습니다" 표시, 이후 로그인 가능
- **검증**: Playwright e2e — 로컬 Supabase의 Inbucket에서 인증 메일을 읽어 링크를 클릭하는 단계까지 포함 (`bun run test:e2e -- signup`)

---

### Task 3: 로그인 — ✅ 완료 (commit 3d957d2, 로그아웃 액션/헤더 상태 표시 포함)

- **담당 시나리오**: Scenario 2 (full)
- **크기**: M (3 파일)
- **의존성**: Task 2 (계정이 존재해야 로그인 가능)
- **참조**: web-design-guidelines — 에러 메시지 폼 접근성
- **구현 대상**:
  - `app/login/page.tsx`
  - `app/login/actions.ts`
  - `e2e/login.spec.ts`
- **수용 기준**:
  - [ ] 인증된 계정 + 올바른 비밀번호 → 로그인 성공, 메인 페이지로 이동
  - [ ] 인증되지 않은 계정으로 로그인 시도 → "이메일 인증이 필요합니다" 에러 표시, 로그인되지 않음
  - [ ] 잘못된 비밀번호 → "이메일 또는 비밀번호가 올바르지 않습니다" 에러 표시
- **검증**: Playwright e2e (`bun run test:e2e -- login`)

---

### Checkpoint: Task 1-3 이후
- [ ] 모든 테스트 통과: `bun run test`, `bun run test:e2e`
- [ ] 빌드 성공: `bun run build`
- [ ] 게스트가 메인 페이지에서 게임을 보고, 가입해서 로그인할 수 있다 — end-to-end 동작

---

### Task 4: 게임 검색

- **담당 시나리오**: Scenario 4 (full)
- **크기**: S (2 파일)
- **의존성**: Task 1
- **구현 대상**:
  - `app/page.tsx` (검색 쿼리 파라미터 처리 추가)
  - `lib/games.ts` (이름 검색 쿼리 함수)
  - `e2e/search.spec.ts`
- **수용 기준**:
  - [ ] 존재하는 게임 이름 일부 입력 → 해당 게임(들)이 검색 결과에 표시
  - [ ] 일치하는 게임이 없는 검색어 입력 → "검색 결과가 없습니다" 표시
- **검증**: Playwright e2e (`bun run test:e2e -- search`)

---

### Task 5: 게임 상세 페이지 조회

- **담당 시나리오**: Scenario 5 (full)
- **크기**: M (6 파일 — 이 화면이 표시할 위키 이력/리뷰/태그 스키마를 Task 6·7보다 먼저 여기서 만듦. 두 Task는 이미 있는 테이블에 쓰기만 하므로 자기 몫 파일 수가 늘지 않음)
- **의존성**: Task 1
- **참조**:
  - shadcn — `bunx shadcn@latest add tabs` 먼저 실행
  - vercel-composition-patterns — 서브탭 합성
- **구현 대상**:
  - `supabase/migrations/0003_game_wiki_revisions.sql` (Task 6이 쓸 위키 이력 스키마를 여기서 먼저 생성 — 이 화면이 읽어야 하기 때문)
  - `supabase/migrations/0004_reviews_tags.sql` (Task 7이 쓸 `reviews`/`tags`/`review_tags` 스키마를 여기서 먼저 생성 — 태그 집계·평균 평점을 이 화면이 읽어야 하기 때문)
  - `app/games/[id]/page.tsx`
  - `components/games/game-detail-tabs.tsx` (위키/리뷰 서브탭)
  - `lib/games.ts` (상세 조회: 메타데이터 + 평균 평점 + 태그 집계 + 편집 이력)
  - `e2e/game-detail.spec.ts`
- **수용 기준**:
  - [ ] 게임 상세 페이지 접속 → 메타데이터와 위키 본문이 함께 표시
  - [ ] 편집 이력이 있는 게임 → 편집자와 시각이 최신순으로 목록에 표시
  - [ ] 편집 이력이 없는 게임(시딩 직후) → 이력 목록이 비어 있음을 나타내는 문구 표시
  - [ ] 리뷰에 태그가 달린 게임 → "리뷰어 N명이 [태그]로 태그함" 형태로 태그별 집계가 표시
  - [ ] 리뷰가 없는 게임 → 태그 집계 영역에 표시할 내용이 없음을 나타내는 문구 표시
- **검증**: Playwright e2e (`bun run test:e2e -- game-detail`). 태그 집계·편집 이력 표시는 시딩 데이터에 더해 테스트에서 리뷰/리비전을 직접 삽입해 두 상태(있음/없음) 모두 검증

---

### Checkpoint: Task 4-5 이후
- [ ] 모든 테스트 통과, 빌드 성공
- [ ] 메인 페이지에서 검색해 게임 상세로 들어가는 흐름이 end-to-end 동작

---

### Task 6: 위키 본문 편집

- **담당 시나리오**: Scenario 6 (full), Scenario 12 (첫 위키 편집 업적만)
- **크기**: M (6 파일 — achievements 공유 인프라를 이 Task에서 최초 도입해 M 상한을 살짝 넘김. 이후 Task 7-10은 이 인프라를 재사용만 하므로 파일 수가 늘지 않음)
- **의존성**: Task 3 (로그인), Task 5 (게임 상세·편집 이력 표시)
- **참조**:
  - shadcn — `bunx shadcn@latest add sonner` 먼저 실행 (업적 토스트용)
- **구현 대상**:
  - `supabase/migrations/0005_achievements.sql` (`achievements` 시드 데이터 포함, `user_achievements`)
  - `lib/achievements.ts` (`awardIfFirst(userId, key)` — 해당 유형 행동이 이번이 처음인지 확인 후 지급, unique 제약으로 중복 방지)
  - `app/games/[id]/edit/page.tsx`
  - `app/games/[id]/edit/actions.ts` (본문 저장 + `game_wiki_revisions` insert + `awardIfFirst('first_wiki_edit')`)
  - `app/layout.tsx` (`<Toaster />` 추가)
  - `e2e/wiki-edit.spec.ts`
- **수용 기준**:
  - [ ] 로그인 사용자가 본문 수정 후 저장 → 상세 페이지에 수정된 본문이 바로 표시, 편집 이력에 항목 추가
  - [ ] 비로그인 사용자가 "편집" 버튼 클릭 → 로그인 페이지로 이동
  - [ ] 빈 본문으로 저장 시도 → "내용을 입력해주세요" 에러 표시, 저장되지 않음
  - [ ] 두 사용자가 같은 문서를 거의 동시에 각자 수정해 저장 → 나중에 저장된 내용이 최종 본문이 되고, 편집 이력에는 두 저장 모두 기록됨
  - [ ] 첫 위키 편집 → "첫 위키 편집" 업적 토스트 표시, 프로필에 뱃지 추가(뱃지 노출 화면은 Task 11)
  - [ ] 이미 업적을 획득한 사용자가 다른 게임을 또 편집 → 토스트가 다시 표시되지 않음
- **검증**: Playwright e2e (`bun run test:e2e -- wiki-edit`). 동시편집은 두 개의 브라우저 컨텍스트로 순차 저장 후 최종 본문·이력 개수 단언

---

### Task 7: 리뷰 작성과 수정

- **담당 시나리오**: Scenario 7 (full), Scenario 12 (첫 리뷰 작성 업적만)
- **크기**: M (3 파일 — `reviews`/`tags`/`review_tags` 스키마는 Task 5에서 이미 생성됨, 여기서는 쓰기 UI·액션만 추가)
- **의존성**: Task 3, Task 5 (스키마 및 게임 상세 화면), Task 6 (`awardIfFirst` 재사용)
- **구현 대상**:
  - `app/games/[id]/reviews/new/page.tsx`
  - `app/games/[id]/reviews/actions.ts` (upsert + `awardIfFirst('first_review')`)
  - `e2e/review.spec.ts`
- **수용 기준**:
  - [ ] 별점 4점 + 본문 입력 → 리뷰 목록에 추가, 평균 평점이 재계산되어 표시
  - [ ] 태그 "마피아류", "파티게임" 선택 후 등록 → 리뷰에 두 태그가 함께 표시되고, 게임 상세의 태그 집계에 반영됨
  - [ ] 태그를 하나도 선택하지 않고 등록 → 태그 없이 리뷰만 등록됨
  - [ ] 고정 목록 밖의 값은 태그로 선택할 수 없음 (자유 입력 UI 자체가 없음)
  - [ ] 이미 리뷰를 남긴 게임에 다시 리뷰 등록 시도 → 기존 리뷰(본문·별점·태그)가 수정되며 목록에 리뷰가 중복 생성되지 않음
  - [ ] 비로그인 사용자가 리뷰 작성 시도 → 로그인 페이지로 이동
  - [ ] 첫 리뷰 작성 → "첫 리뷰 작성" 업적 토스트 표시
  - [ ] 이미 "첫 리뷰 작성" 업적을 획득한 사용자가 다른 게임에 또 리뷰를 남김 → 토스트가 다시 표시되지 않음
- **검증**: Playwright e2e (`bun run test:e2e -- review`)

---

### Checkpoint: Task 6-7 이후
- [ ] 모든 테스트 통과, 빌드 성공
- [ ] 로그인 사용자가 위키를 고치고 리뷰(태그 포함)를 남길 수 있다 — end-to-end 동작
- [ ] 업적 토스트 + 지급 로직이 정상 동작 (중복 지급 없음)

---

### Task 8: 게시판 글 작성과 조회

- **담당 시나리오**: Scenario 8 (full), Scenario 12 (첫 게시글 작성 업적만)
- **크기**: M (5 파일)
- **의존성**: Task 3, Task 5, Task 6 (`awardIfFirst`)
- **참조**: shadcn — tabs 재사용(카테고리 전환)
- **구현 대상**:
  - `supabase/migrations/0006_posts.sql`
  - `app/games/[id]/board/page.tsx`
  - `app/games/[id]/board/new/page.tsx`
  - `app/games/[id]/board/actions.ts` (`awardIfFirst('first_post')` 포함)
  - `e2e/board-post.spec.ts`
- **수용 기준**:
  - [ ] 카테고리 선택 + 제목/본문 입력 → 등록 즉시 해당 카테고리 목록 최상단에 표시
  - [ ] 제목 없이 등록 시도 → "제목을 입력해주세요" 에러 표시
  - [ ] 비로그인 사용자가 목록 조회 → 글 목록과 본문을 볼 수 있음
  - [ ] 비로그인 사용자가 "글쓰기" 클릭 → 로그인 페이지로 이동
  - [ ] 첫 게시글 작성 → "첫 게시글 작성" 업적 토스트 표시
  - [ ] 이미 "첫 게시글 작성" 업적을 획득한 사용자가 두 번째 게시글을 작성 → 토스트가 다시 표시되지 않음
- **검증**: Playwright e2e (`bun run test:e2e -- board-post`)

---

### Task 9: 댓글 작성

- **담당 시나리오**: Scenario 9 (full), Scenario 12 (첫 댓글 작성 업적만)
- **크기**: M (4 파일)
- **의존성**: Task 6 (`awardIfFirst` 재사용), Task 8
- **구현 대상**:
  - `supabase/migrations/0007_comments.sql`
  - `app/games/[id]/board/[postId]/page.tsx`
  - `app/games/[id]/board/[postId]/actions.ts` (`awardIfFirst('first_comment')` 포함)
  - `e2e/comment.spec.ts`
- **수용 기준**:
  - [ ] 댓글 입력 후 등록 → 게시글 하단 댓글 목록에 즉시 추가
  - [ ] 빈 댓글 등록 시도 → 등록되지 않고 에러 표시
  - [ ] 비로그인 사용자가 댓글 입력 시도 → 로그인 페이지로 이동
  - [ ] 첫 댓글 작성 → "첫 댓글 작성" 업적 토스트 표시
  - [ ] 이미 "첫 댓글 작성" 업적을 획득한 사용자가 다른 게시글에 또 댓글을 작성 → 토스트가 다시 표시되지 않음
- **검증**: Playwright e2e (`bun run test:e2e -- comment`)

---

### Task 10: 게시글 좋아요

- **담당 시나리오**: Scenario 10 (full), Scenario 12 (본인 게시글 첫 좋아요 받음 업적만)
- **크기**: M (3 파일)
- **의존성**: Task 6 (`awardIfFirst` 재사용), Task 8, Task 9 (같은 화면에 붙는 액션)
- **구현 대상**:
  - `supabase/migrations/0008_post_likes.sql`
  - `app/games/[id]/board/[postId]/actions.ts` (좋아요 토글 + `awardIfFirst('first_post_liked')`은 좋아요를 받은 게시글 작성자 기준으로 지급)
  - `e2e/post-like.spec.ts`
- **수용 기준**:
  - [ ] 좋아요 클릭 → 좋아요 수 +1, 버튼이 활성 상태로 표시
  - [ ] 이미 누른 좋아요를 다시 클릭 → 좋아요 취소, 수가 -1
  - [ ] 비로그인 사용자가 좋아요 클릭 → 로그인 페이지로 이동
  - [ ] 본인이 쓴 게시글이 처음으로 좋아요를 받음 → 게시글 작성자에게 "첫 좋아요 받음" 업적 토스트 표시 (좋아요를 누른 사람에게는 표시되지 않음)
  - [ ] 이미 "첫 좋아요 받음" 업적을 획득한 사용자의 다른 게시글이 또 좋아요를 받음 → 토스트가 다시 표시되지 않음
- **검증**: Playwright e2e (`bun run test:e2e -- post-like`) — 업적 토스트는 작성자 계정으로 재로그인해 확인

---

### Checkpoint: Task 8-10 이후
- [ ] 모든 테스트 통과, 빌드 성공
- [ ] 게시판에서 글 쓰고, 댓글 달고, 좋아요 누르는 흐름이 end-to-end 동작
- [ ] 게시판 관련 업적 3종 모두 정상 지급

---

### Task 11: 프로필 페이지 조회

- **담당 시나리오**: Scenario 11 (full), Scenario 12 (업적 뱃지 프로필 노출 확인)
- **크기**: M (4 파일)
- **의존성**: Task 6, 7, 8, 9 (표시할 활동 데이터 소스)
- **참조**:
  - shadcn — `bunx shadcn@latest add avatar` 먼저 실행
  - vercel-composition-patterns — 탭 합성
- **구현 대상**:
  - `app/profile/page.tsx`
  - `components/profile/profile-tabs.tsx` (위키편집/리뷰/게시글·댓글 탭)
  - `lib/profile.ts` (활동 목록 + 뱃지 조회)
  - `e2e/profile.spec.ts`
- **수용 기준**:
  - [ ] 위키를 편집한 적 있는 사용자 → 프로필에 편집한 게임 문서 목록이 표시
  - [ ] 리뷰를 남긴 적 있는 사용자 → 프로필에 작성한 리뷰 목록이 표시
  - [ ] 업적을 획득한 사용자 → 프로필에 획득한 뱃지가 표시
  - [ ] 아무 활동도 없는 신규 사용자 → 각 목록에 "아직 활동이 없습니다" 문구 표시
- **검증**: Playwright e2e (`bun run test:e2e -- profile`)

---

### Checkpoint: Task 11 이후 (최종)
- [ ] 모든 테스트 통과: `bun run test`, `bun run test:e2e`
- [ ] 빌드 성공: `bun run build`
- [ ] 회원가입 → 로그인 → 위키 편집/리뷰/게시글/댓글/좋아요 → 프로필에서 활동·업적 확인까지 전체 플로우가 end-to-end 동작

## 미결정 항목

없음 — 계획에 필요한 항목은 draft-plan 단계에서 모두 확인해 결정했다.
