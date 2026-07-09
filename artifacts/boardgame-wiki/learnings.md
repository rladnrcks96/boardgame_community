# boardgame-wiki — learnings

---
category: tooling
applied: not-yet
---
## 로컬 Supabase(CLI+Docker) 대신 클라우드 전용으로 전환

**상황**: execute-plan Step 1, 전제 조건 확인 중 이 머신에 Docker와 Supabase CLI가 전혀 설치되어 있지 않고 `.env.local`도 없음을 발견. plan.md는 draft-plan 단계에서 "로컬 Supabase(CLI+Docker)"를 테스트 DB로 쓰기로 결정해뒀었음.
**판단**: 사용자가 Docker Desktop 설치(시스템 변경, 재부팅 가능성) 대신 클라우드 Supabase 프로젝트만으로 진행하기를 선택. plan.md의 아키텍처 결정과 인프라 리소스 표를 "로컬 Supabase(CLI+Docker)" → "클라우드 Supabase 프로젝트(테스트용 별도 프로젝트 없이 dev 프로젝트를 그대로 사용, 리뷰 규모가 작아 우선 단일 프로젝트로 시작)"로 변경. 통합 테스트는 dev 프로젝트에 대해 직접 실행하고, 테스트 데이터 정리(cleanup)를 각 e2e 스펙의 afterEach에서 명시적으로 수행하는 방식으로 오염을 방지.
**다시 마주칠 가능성**: 높음 — 다른 feature/side project에서도 로컬 Docker 환경 없이 시작하는 경우가 반복될 수 있음. draft-plan 단계에서 "테스트 DB를 로컬로 할지" 물을 때 사용자 머신에 Docker가 이미 있는지 먼저 확인하는 질문을 추가하는 게 낫다.

---
category: spec-ambiguity
applied: not-yet
---
## BGG XML API가 정책 변경으로 즉시 사용 불가 — 수동 시딩으로 대체

**상황**: Task 1 실행 중 `scripts/seed-games.ts`가 호출할 BGG XML API2(`/xmlapi2/thing`)를 curl과 실제 브라우저 양쪽에서 테스트했더니 "Unauthorized" 응답. 확인해보니 2025-07-02자로 BGG가 정책을 바꿔 비상업 사용도 애플리케이션 등록 + Bearer 토큰 승인(수일~1주)이 필요해졌음. idea-refine 단계에서 확인했던 "비상업 사용은 라이선스 불필요"는 등록 자체가 필요 없다는 뜻이 아니었는데, 그때는 이 등록 요구사항까지 확인하지 못했음. 대체 API(Board Game Atlas)도 도메인이 아예 응답하지 않아(DNS 실패) 폐업한 것으로 보임.
**판단**: 사용자가 BGG 애플리케이션 등록은 신청했으나 승인 대기 중. 승인을 기다리며 전체 일정을 블록하는 대신, 잘 알려진 상위권 게임 20-30개를 직접 큐레이션한 데이터(이름/인원수/플레이타임/카테고리는 일반적으로 알려진 사실, BGG의 독점 데이터 아님)로 Task 1을 진행하기로 사용자와 합의. 이미지는 저작권 문제(구글 이미지 무단 스크래핑도 대안으로 제안됐으나 출처 불명 이미지 재게시라 BGG 핫링크보다 더 위험하다고 판단해 거절)로 placeholder 처리. `bgg_rank`는 실제 순위가 아닌 큐레이션 순서로 근사. BGG 승인 나면 실제 API 연동으로 교체하는 별도 후속 Task를 plan.md에 남겨둠.
**다시 마주칠 가능성**: 높음 — 외부 API에 의존하는 모든 feature의 draft-plan/execute-plan에서, 계획 수립 시점과 실행 시점 사이에 대상 API의 이용 정책이 바뀌어 있을 수 있다는 걸 가정하고 실행 직전에 실제 호출을 한 번 테스트하는 단계를 넣는 게 나을 것 같다. spec/idea 단계의 "이용약관 확인"은 그 시점의 스냅샷일 뿐 실행 시점에 유효하다는 보장이 없다.

---
category: task-ordering
applied: not-yet
---
## 읽기 화면(Task 5)이 쓰기 기능(Task 6·7)보다 먼저 오는데 그 쓰기 기능의 스키마를 읽어야 했음

**상황**: Task 1 완료 후 Task 5(게임 상세 조회) 구현을 준비하며 plan.md를 다시 보니, Task 5는 위키 편집 이력·리뷰·태그 집계를 화면에 표시해야 하는데 `game_wiki_revisions`/`reviews`/`tags`/`review_tags` 테이블은 각각 Task 6·7에서 생성되도록 계획돼 있었음. Task 5가 Task 6·7보다 먼저 실행되므로, 계획대로면 존재하지 않는 테이블을 조회하는 코드를 짜야 하는 순서 오류였음. draft-plan의 독립 검토(Step 5)는 파일·의존성 표기 일관성은 잡아냈지만 이 "읽기 화면이 조회할 테이블을 쓰기 Task가 나중에 만든다"는 타이밍 문제는 못 잡아냄.
**판단**: 해당 스키마(마이그레이션 파일)의 소유권을 Task 6·7에서 Task 5로 옮김. Task 5가 스키마를 먼저 만들고(빈 테이블 상태로 시작), Task 6·7은 이미 있는 테이블에 쓰기 UI·액션만 추가하는 것으로 plan.md를 수정. "기능을 만드는 Task가 그 데이터의 스키마도 만든다"는 직관이, "그 데이터를 먼저 읽어야 하는 화면이 있으면 스키마 소유권은 읽기 화면 쪽으로 당겨와야 한다"는 규칙에 밀린 사례.
**다시 마주칠 가능성**: 높음 — 목록/상세/집계 화면을 먼저 배치하고 그 데이터를 만드는 CRUD 기능을 나중에 배치하는 패턴(이번 계획 자체가 그랬음: 읽기를 앞에, 쓰기를 뒤에)에서 구조적으로 반복될 문제. draft-plan Step 4(plan.md 생성) 또는 Step 5(독립 검토)에 "각 Task가 조회하는 테이블이 자기 자신이나 더 이른 Task에서 생성되는지" 체크리스트를 추가할 만하다.

---
category: tooling
applied: not-yet
---
## Supabase 기본 이메일 발송 레이트 리밋이 반복 e2e 실행을 막음

**상황**: Task 2 e2e 테스트(회원가입)를 두 번 돌리는 사이 실제 `supabase.auth.signUp()`을 여러 번 호출했고(테스트마다 새 이메일로 가입), Supabase 무료 티어 기본 SMTP의 시간당 발송 한도(`over_email_send_rate_limit`, HTTP 429)를 소진함. 처음엔 증상이 "새 이메일인데도 이미 가입된 이메일 에러가 뜬다"로 보였는데, 원인은 내 서버 액션이 signUp의 모든 에러를 "이미 사용 중인 이메일입니다"로 뭉뚱그려 처리해서 진짜 원인(레이트 리밋)을 가리고 있었던 것.
**판단**: 액션 코드는 `error.code === "user_already_exists"`일 때만 중복 이메일 메시지를 보이고 그 외는 일반 에러 메시지로 수정. 테스트 전략은 실제 `signUp()`을 호출해 메일을 발송시키는 테스트(신규 가입, 중복 가입)는 한도가 풀릴 때까지 보류하고, 이메일 발송이 필요 없는 `admin.createUser`/`admin.generateLink` 기반 테스트(로그인, 인증링크 클릭)만 먼저 통과 확인. 사용자는 지금은 넘어가고 나중에 필요하면 Resend 같은 커스텀 SMTP를 붙이기로 결정.
**다시 마주칠 가능성**: 높음 — 이메일 인증이 들어가는 모든 feature의 e2e 테스트에서 반복 실행 시 같은 한도에 걸릴 것. 앞으로 이메일 발송이 필요한 시나리오는 테스트에서 `admin.createUser(email_confirm: true/false)`처럼 이메일을 안 보내는 admin API로 상태를 세팅하고, 실제 `signUp()`을 거치는 테스트는 스위트당 최소 개수로 줄이는 규칙을 세워두는 게 좋겠다.

---
category: tooling
applied: not-yet
---
## RLS 정책 누락은 에러 없이 조용히 실패한다 (UPDATE/SELECT)

**상황**: Task 6 위키 편집에서 저장 후 본문이 반영 안 되는 버그. `games` 테이블에 SELECT 정책만 만들고 UPDATE 정책을 빠뜨렸는데, Supabase JS의 `.update()`는 RLS에 막혀도 에러를 던지지 않고 그냥 0행 반영으로 "성공"을 반환한다. INSERT의 `WITH CHECK` 위반은 실제 에러를 던지지만, UPDATE/SELECT의 `USING` 위반은 조용히 필터링만 된다는 걸 헷갈렸음.
**판단**: 새 테이블을 만들 때 "누가 이 데이터를 쓰기(insert/update/delete)할 수 있는가"를 SELECT 정책 옆에 바로 같이 적는 습관을 들이기로 함. 이번엔 놓친 UPDATE 정책을 별도 마이그레이션으로 추가해 해결.
**다시 마주칠 가능성**: 높음 — Task 7-10에서 posts/comments/post_likes 등 새 테이블을 만들 때마다 같은 실수를 반복할 수 있다. 각 테이블 마이그레이션 작성 시 select/insert/update/delete 네 가지를 체크리스트로 확인하는 게 낫다.

---
category: tooling
applied: not-yet
---
## e2e 테스트가 실패하면 cleanup을 못 돌아 DB에 잔여 데이터가 쌓인다

**상황**: wiki-edit 테스트를 디버깅하며 여러 번 실패했는데, 매번 assertion 실패 지점 이후의 `cleanupUserContent`/`deleteUserByEmail` 호출이 스킵되어, 같은 시딩 게임에 리비전이 누적되고 테스트 계정도 고아로 남음. 그 누적된 데이터가 "정확히 1개"를 기대하는 다음 assertion을 다시 깨뜨려 원인 파악을 더 어렵게 만들었다(진짜 앱 버그처럼 보였음).
**판단**: 테스트 본문을 `try { ...assertion... } finally { ...cleanup... }`으로 감싸 assertion 실패와 무관하게 cleanup이 항상 실행되도록 수정. 이미 쌓인 잔여 데이터는 service_role 스크립트로 직접 지움.
**다시 마주칠 가능성**: 높음 — 사용자/리뷰/게시글 등을 생성하는 모든 e2e 테스트에 해당하는 패턴. Task 7 이후 새로 쓰는 e2e 테스트는 처음부터 try/finally로 cleanup을 감싸는 걸 기본값으로 한다.

---
category: tooling
applied: not-yet
---
## Next.js 라우트 어나운서가 role="alert"라 커스텀 에러 메시지 locator가 항상 strict-mode에서 깨진다

**상황**: `page.getByRole("alert")`로 폼 에러 메시지를 찾는 테스트가 login/signup/wiki-edit 세 파일에서 반복적으로 "resolved to 2 elements" 에러를 냄. Next.js가 페이지 전환을 스크린리더에 알리기 위해 `<div role="alert" id="__next-route-announcer__">`를 항상 렌더링해서, 앱의 에러 메시지 `role="alert"`와 항상 겹친다.
**판단**: `getByRole("alert")` 대신 `getByText(정확한 문구)` 또는 `[data-slot="field-error"]`처럼 더 구체적인 locator를 쓰도록 세 파일 모두 수정.
**다시 마주칠 가능성**: 높음 — Next.js App Router를 쓰는 한 이 라우트 어나운서는 항상 존재한다. 앞으로 에러 메시지 assertion은 처음부터 `getByRole("alert")`를 쓰지 않는 걸 기본 규칙으로 삼는 게 낫다.

---
category: correctness
applied: not-yet
---
## posts 테이블 추가로 PostgREST의 `profiles(nickname)` 임베드가 모호해짐

**상황**: Task 10에서 `post_likes`(다대다: posts↔profiles)를 만들자, 이미 있던 `posts` → `profiles(nickname)` 임베드 조회(author_id를 통한 단순 FK)가 "more than one relationship was found" 에러로 깨짐. 새 테이블이 두 번째 경로를 만들어서 PostgREST가 어느 관계를 쓸지 더 이상 추측 못 하게 됨. 증상은 게시글 상세 페이지가 전부 404로 보이는 것이었는데, 원인은 라우팅이 아니라 쿼리였다.
**판단**: `profiles!posts_author_id_fkey(nickname)` 처럼 FK 이름을 명시해 모호성을 없앰.
**다시 마주칠 가능성**: 높음 — 두 테이블 사이에 새로운 관계(특히 다대다 조인 테이블)를 추가할 때마다, 기존에 암묵적 임베드(`table(column)` 축약형)를 쓰던 다른 쿼리들이 갑자기 깨질 수 있다. 새 테이블을 추가한 뒤에는 관련된 기존 임베드 쿼리를 전부 재확인하는 습관이 필요하다.

---
category: correctness
applied: not-yet
---
## 루트 레이아웃의 클라이언트 컴포넌트는 클라이언트 사이드 전환에서 리마운트되지 않는다

**상황**: Task 10에서 "좋아요를 받은 작성자가 다음에 로그인해서 페이지를 열면 업적 토스트가 뜬다" 기능을 만들었는데, 실제 앱에서 로그인 폼 제출(서버 액션의 redirect) 직후에는 토스트가 안 뜨고, Playwright 테스트에서 `authorPage.goto("/")`로 강제 완전 네비게이션을 하면 떴다. 원인: `AchievementNotifier`가 루트 레이아웃에 있어 앱 전체 세션 동안 한 번만 마운트되고, `useEffect(() => {...}, [])`가 딱 한 번(로그인 전, 게스트 상태로) 실행된 뒤 그 뒤로 다시 실행되지 않았다. 서버 액션의 `redirect()`가 만드는 클라이언트 사이드 전환은 레이아웃을 리마운트시키지 않기 때문.
**판단**: `usePathname()`을 의존성 배열에 넣어 페이지 이동마다 effect가 다시 실행되게 고침. 이건 테스트만의 문제가 아니라 실사용자도 겪을 버그였음 — 테스트에서 우회(`goto`로 강제 새로고침)하는 대신 근본 원인을 고쳤다.
**다시 마주칠 가능성**: 높음 — 로그인 상태나 URL에 따라 한 번만 실행돼야 하는 게 아니라 "현재 페이지마다" 다시 확인해야 하는 로직을 루트 레이아웃의 client component에 넣을 때마다 반복될 문제. 이런 컴포넌트는 기본적으로 `usePathname()`(또는 관련 상태)을 의존성에 넣는 걸 원칙으로 삼는 게 낫다.
