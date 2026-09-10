import { apiFetch } from "../client";
import {
  matchSchema,
  matchListSchema,
  matchDetailSchema,
  h2hSummarySchema,
  type Match,
  type MatchDetail,
  type H2HSummary,
  type MatchStatusType,
} from "../schemas/match.schema";

export interface GetMatchesParams {
  /** yyyy-MM-dd — mặc định BE trả trận hôm nay nếu không truyền */
  date?: string;
  leagueId?: string;
  status?: MatchStatusType;
  sport?: "football" | "basketball";
  season?: string;
}

/**
 * Lấy danh sách trận đấu theo ngày, giải đấu, mùa giải hoặc trạng thái
 */
export async function getMatches(params: GetMatchesParams = {}): Promise<Match[]> {
  const query = new URLSearchParams();
  if (params.date) query.set("date", params.date);
  if (params.leagueId) query.set("leagueId", params.leagueId);
  if (params.status) query.set("status", params.status);
  if (params.sport) query.set("sport", params.sport);
  if (params.season) query.set("season", params.season);

  const { data } = await apiFetch<unknown>(`/matches?${query.toString()}`);
  return matchListSchema.parse(data);
}

/**
 * Lấy thông tin chi tiết một trận đấu (bao gồm sự kiện, stats, ...)
 */
export async function getMatchById(id: string): Promise<MatchDetail> {
  const { data } = await apiFetch<unknown>(`/matches/${id}`);
  return matchDetailSchema.parse(data);
}

/**
 * Lấy lịch sử đối đầu (Head-to-Head) giữa 2 đội của trận đấu
 */
export async function getMatchH2H(matchId: string): Promise<H2HSummary> {
  const { data } = await apiFetch<unknown>(`/matches/${matchId}/h2h`);
  return h2hSummarySchema.parse(data);
}
