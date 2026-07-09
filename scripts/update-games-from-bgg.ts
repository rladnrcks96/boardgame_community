import { XMLParser } from "fast-xml-parser";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/database.types";

type GameUpdate = Database["public"]["Tables"]["games"]["Update"];

const BGG_TOKEN = process.env.BGG_API_TOKEN;
if (!BGG_TOKEN) {
  console.error("BGG_API_TOKEN이 .env.local에 없습니다");
  process.exit(1);
}

const BGG_IDS = [
  174430, 224517, 342942, 167791, 162886, 266192, 161936, 233078, 187645, 169786,
  199792, 237182, 220308, 115746, 124361, 68448, 230802, 148228, 178900, 13,
  822, 30549, 36218, 3076, 31260,
];

function toArray<T>(value: T | T[] | undefined): T[] {
  if (value === undefined) return [];
  return Array.isArray(value) ? value : [value];
}

function difficultyLabel(weight: number): string {
  if (weight < 2) return "하";
  if (weight < 3.5) return "중";
  return "상";
}

function chunk<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size));
  return chunks;
}

async function fetchItems(ids: number[]) {
  const res = await fetch(`https://boardgamegeek.com/xmlapi2/thing?id=${ids.join(",")}&stats=1`, {
    headers: { Authorization: `Bearer ${BGG_TOKEN}` },
  });

  if (!res.ok) {
    console.error("BGG API 요청 실패:", res.status, await res.text());
    process.exit(1);
  }

  const xml = await res.text();
  const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_" });
  const parsed = parser.parse(xml);
  return toArray(parsed.items.item);
}

async function main() {
  const items = (await Promise.all(chunk(BGG_IDS, 20).map(fetchItems))).flat();

  const supabase = createAdminClient();
  let updated = 0;

  for (const item of items) {
    const bggId = Number(item["@_id"]);
    const names = toArray(item.name);
    const primaryName = names.find((n) => n["@_type"] === "primary")?.["@_value"] ?? names[0]?.["@_value"];
    const imageUrl: string | undefined = item.image;
    const minPlayers = Number(item.minplayers?.["@_value"]);
    const maxPlayers = Number(item.maxplayers?.["@_value"]);
    const minPlaytime = Number(item.minplaytime?.["@_value"]);
    const maxPlaytime = Number(item.maxplaytime?.["@_value"]);
    const weight = Number(item.statistics?.ratings?.averageweight?.["@_value"]);
    const ranks = toArray(item.statistics?.ratings?.ranks?.rank);
    const boardgameRank = ranks.find((r) => r["@_name"] === "boardgame")?.["@_value"];

    const update: GameUpdate = {
      image_url: imageUrl,
      min_players: minPlayers,
      max_players: maxPlayers,
      playtime_min: minPlaytime,
      playtime_max: maxPlaytime,
    };
    if (!Number.isNaN(weight) && weight > 0) update.difficulty_label = difficultyLabel(weight);
    if (boardgameRank && boardgameRank !== "Not Ranked") update.bgg_rank = Number(boardgameRank);

    const { error } = await supabase.from("games").update(update).eq("bgg_id", bggId);
    if (error) {
      console.error(`게임 ${bggId}(${primaryName}) 업데이트 실패:`, error.message);
      continue;
    }
    updated += 1;
    console.log(`업데이트: ${primaryName} (rank ${update.bgg_rank ?? "?"})`);
  }

  console.log(`${updated}/${items.length}개 게임 업데이트 완료`);
}

main();
