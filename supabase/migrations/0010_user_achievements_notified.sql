-- 본인이 직접 트리거한 업적(위키편집/리뷰/게시글/댓글)은 그 자리에서 바로 토스트로 보여주므로 notified=true로 시작한다.
-- 남이 트리거하는 업적(첫 좋아요 받음)만 notified=false로 시작해, 작성자가 다음에 로그인 상태로 아무 페이지든 열 때 알려준다.
alter table user_achievements add column notified boolean not null default true;
