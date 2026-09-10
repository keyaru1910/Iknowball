// src/module/sports-data/adapters/api-football.adapter.ts
import { Injectable, Logger, HttpException } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';

@Injectable()
export class ApiFootballAdapter {
  private readonly logger = new Logger(ApiFootballAdapter.name);
  private readonly client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: 'https://v3.football.api-sports.io',
      timeout: 8000,
      headers: {
        'x-apisports-key': process.env.API_FOOTBALL_KEY || '',
      },
    });
  }

  async getLeagues(country?: string, id?: number): Promise<any[]> {
    const params: Record<string, any> = { current: 'true' };
    if (country) params.country = country;
    if (id) params.id = String(id);
    return this.requestWithRetry('/leagues', params);
  }

  async getTeams(leagueId: string, season: string): Promise<any[]> {
    return this.requestWithRetry('/teams', { league: leagueId, season });
  }

  async getFixtures(
    leagueId: string,
    season: string,
    options?: {
      status?: string;
      from?: string;
      to?: string;
      live?: string;
    },
  ): Promise<any[]> {
    const params: Record<string, any> = { league: leagueId, season };
    if (options?.status) params.status = options.status;
    if (options?.from) params.from = options.from;
    if (options?.to) params.to = options.to;
    if (options?.live) params.live = options.live;
    return this.requestWithRetry('/fixtures', params);
  }

  async getStandings(leagueId: string, season: string): Promise<any[]> {
    return this.requestWithRetry('/standings', { league: leagueId, season });
  }

  // Retry + exponential backoff cho rate limit (429) và lỗi mạng tạm thời
  private async requestWithRetry(
    path: string,
    params: Record<string, any>,
    attempt = 1,
  ): Promise<any[]> {
    try {
      const res = await this.client.get(path, { params });
      return res.data?.response ?? [];
    } catch (err: any) {
      const status = err?.response?.status;

      if (status === 429 && attempt <= 3) {
        const backoffMs = 1000 * 2 ** attempt; // 2s, 4s, 8s
        this.logger.warn(
          `[API-Football] Bị Rate Limit tại ${path}, thử lại sau ${backoffMs}ms (lần ${attempt})`,
        );
        await new Promise((resolve) => setTimeout(resolve, backoffMs));
        return this.requestWithRetry(path, params, attempt + 1);
      }

      if (
        (err?.code === 'ECONNABORTED' || (status && status >= 500)) &&
        attempt <= 3
      ) {
        const backoffMs = 1000 * attempt;
        this.logger.warn(
          `[API-Football] Lỗi tạm thời tại ${path}, thử lại sau ${backoffMs}ms (lần ${attempt})`,
        );
        await new Promise((resolve) => setTimeout(resolve, backoffMs));
        return this.requestWithRetry(path, params, attempt + 1);
      }

      this.logger.error(`[API-Football] Gọi thất bại tới ${path}: ${err?.message}`);
      throw new HttpException(`API-Football request failed: ${path}`, status || 502);
    }
  }
}