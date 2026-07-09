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
