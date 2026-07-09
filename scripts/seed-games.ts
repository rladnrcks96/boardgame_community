import { createAdminClient } from "@/lib/supabase/admin";

// BGG XML API가 애플리케이션 등록 승인 대기 중이라 실시간 조회 대신 수동 큐레이션한다.
// bgg_id는 기억을 바탕으로 적었으니 API 승인 후 실제 값으로 검증/교체할 것.
// bgg_rank는 실제 순위가 아니라 이 목록의 순서(잘 알려진 순으로 추정)를 그대로 매긴 근사치.
const CURATED_GAMES = [
  { bgg_id: 174430, name: "글룸헤이븐", min_players: 1, max_players: 4, playtime_min: 60, playtime_max: 120, difficulty_label: "상", categories: ["협력", "캠페인"] },
  { bgg_id: 224517, name: "브라스: 버밍엄", min_players: 2, max_players: 4, playtime_min: 60, playtime_max: 120, difficulty_label: "중", categories: ["경제", "네트워크건설"] },
  { bgg_id: 342942, name: "아크노바", min_players: 1, max_players: 4, playtime_min: 90, playtime_max: 150, difficulty_label: "중", categories: ["엔진빌딩", "동물원"] },
  { bgg_id: 167791, name: "테라포밍 마스", min_players: 1, max_players: 5, playtime_min: 90, playtime_max: 120, difficulty_label: "중", categories: ["엔진빌딩", "카드드래프트"] },
  { bgg_id: 162886, name: "스피릿 아일랜드", min_players: 1, max_players: 4, playtime_min: 90, playtime_max: 120, difficulty_label: "상", categories: ["협력", "지역통제"] },
  { bgg_id: 266192, name: "윙스팬", min_players: 1, max_players: 5, playtime_min: 40, playtime_max: 70, difficulty_label: "중", categories: ["엔진빌딩", "카드드래프트"] },
  { bgg_id: 161936, name: "팬데믹 레거시 시즌1", min_players: 2, max_players: 4, playtime_min: 60, playtime_max: 90, difficulty_label: "중", categories: ["협력", "캠페인"] },
  { bgg_id: 233078, name: "트와일라잇 임페리움 4판", min_players: 3, max_players: 6, playtime_min: 240, playtime_max: 480, difficulty_label: "상", categories: ["4X", "외교"] },
  { bgg_id: 187645, name: "스타워즈: 리벨리온", min_players: 2, max_players: 4, playtime_min: 120, playtime_max: 240, difficulty_label: "중", categories: ["비대칭", "지역통제"] },
  { bgg_id: 169786, name: "사이드", min_players: 1, max_players: 5, playtime_min: 90, playtime_max: 115, difficulty_label: "중", categories: ["지역통제", "엔진빌딩"] },
  { bgg_id: 199792, name: "에버델", min_players: 1, max_players: 4, playtime_min: 40, playtime_max: 80, difficulty_label: "중", categories: ["엔진빌딩", "카드드래프트"] },
  { bgg_id: 237182, name: "루트", min_players: 2, max_players: 4, playtime_min: 60, playtime_max: 90, difficulty_label: "중", categories: ["비대칭", "지역통제"] },
  { bgg_id: 220308, name: "가이아 프로젝트", min_players: 1, max_players: 4, playtime_min: 60, playtime_max: 150, difficulty_label: "상", categories: ["엔진빌딩", "지역통제"] },
  { bgg_id: 115746, name: "반지의 전쟁 2판", min_players: 2, max_players: 4, playtime_min: 120, playtime_max: 180, difficulty_label: "상", categories: ["비대칭", "워게임"] },
  { bgg_id: 124361, name: "콘코르디아", min_players: 2, max_players: 5, playtime_min: 90, playtime_max: 120, difficulty_label: "중", categories: ["경제", "카드드래프트"] },
  { bgg_id: 68448, name: "7원더스", min_players: 3, max_players: 7, playtime_min: 30, playtime_max: 30, difficulty_label: "중", categories: ["카드드래프트", "문명"] },
  { bgg_id: 230802, name: "아줄", min_players: 2, max_players: 4, playtime_min: 30, playtime_max: 45, difficulty_label: "하", categories: ["타일배치", "추상전략"] },
  { bgg_id: 148228, name: "스플렌더", min_players: 2, max_players: 4, playtime_min: 30, playtime_max: 30, difficulty_label: "하", categories: ["엔진빌딩", "카드게임"] },
  { bgg_id: 178900, name: "코드네임", min_players: 2, max_players: 8, playtime_min: 15, playtime_max: 15, difficulty_label: "하", categories: ["파티게임", "팀전"] },
  { bgg_id: 13, name: "카탄", min_players: 3, max_players: 4, playtime_min: 60, playtime_max: 120, difficulty_label: "하", categories: ["주사위", "협상"] },
  { bgg_id: 822, name: "카르카손", min_players: 2, max_players: 5, playtime_min: 35, playtime_max: 45, difficulty_label: "하", categories: ["타일배치"] },
  { bgg_id: 30549, name: "팬데믹", min_players: 2, max_players: 4, playtime_min: 45, playtime_max: 45, difficulty_label: "중", categories: ["협력"] },
  { bgg_id: 36218, name: "도미니언", min_players: 2, max_players: 4, playtime_min: 30, playtime_max: 30, difficulty_label: "하", categories: ["덱빌딩"] },
  { bgg_id: 3076, name: "푸에르토리코", min_players: 3, max_players: 5, playtime_min: 90, playtime_max: 150, difficulty_label: "중", categories: ["경제", "역할선택"] },
  { bgg_id: 31260, name: "아그리콜라", min_players: 1, max_players: 5, playtime_min: 90, playtime_max: 150, difficulty_label: "상", categories: ["워커플레이스먼트", "엔진빌딩"] },
].map((game, index) => ({ ...game, bgg_rank: index + 1, image_url: null }));

async function main() {
  const supabase = createAdminClient();

  const { error } = await supabase.from("games").upsert(CURATED_GAMES, { onConflict: "bgg_id" });

  if (error) {
    console.error("시딩 실패:", error.message);
    process.exit(1);
  }

  console.log(`${CURATED_GAMES.length}개 게임 시딩 완료`);
}

main();
