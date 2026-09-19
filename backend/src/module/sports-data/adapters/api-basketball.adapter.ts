// src/module/sports-data/adapters/api-basketball.adapter.ts
import { Injectable, Logger, HttpException } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import { KeyPoolManager } from './utils/key-pool.util';

@Injectable()
export class ApiBasketballAdapter {
  private readonly logger = new Logger(ApiBasketballAdapter.name);
  private readonly client: AxiosInstance;
  private readonly keyPool: KeyPoolManager;

  constructor() {
    this.keyPool = new KeyPoolManager(
      'API-Basketball',
      process.env.API_BASKETBALL_KEY || process.env.API_FOOTBALL_KEY || process.env.RAPIDAPI_KEY || '',
    );
    this.client = axios.create({
      baseURL: 'https://v1.basketball.api-sports.io',
      timeout: 8000,
    });
  }

  private normalizeSeason(season?: string): string {
    if (!season) return '2024-2025';
    const clean = season.trim();
    if (clean.includes('-')) return clean;
    if (clean.length === 4) {
      const start = parseInt(clean, 10);
      return `${start}-${start + 1}`;
    }
    return clean;
  }

  async getLeagues(id = 12): Promise<any[]> {
    // 12 is NBA in API-Basketball
    return this.requestWithRetry('/leagues', { id });
  }

  async getTeams(leagueId = 12, season?: string): Promise<any[]> {
    const normSeason = this.normalizeSeason(season);
    return this.requestWithRetry('/teams', { league: leagueId, season: normSeason });
  }

  async getGames(leagueId = 12, season?: string, date?: string): Promise<any[]> {
    const normSeason = this.normalizeSeason(season);
    const params: Record<string, any> = { league: leagueId, season: normSeason };
    if (date) params.date = date;
    return this.requestWithRetry('/games', params);
  }

  async getStandings(leagueId = 12, season?: string): Promise<any[]> {
    const normSeason = this.normalizeSeason(season);
    return this.requestWithRetry('/standings', { league: leagueId, season: normSeason });
  }

  private async requestWithRetry<T = any>(
    path: string,
    params: Record<string, any> = {},
    attempt = 1,
  ): Promise<any[]> {
    const activeKey = this.keyPool.getActiveKey();
    try {
      const res = await this.client.get(path, {
        params,
        headers: activeKey ? { 'x-apisports-key': activeKey } : {},
      });
      return res.data?.response ?? [];
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 429 && attempt <= 3) {
        this.keyPool.markKeyRateLimited(activeKey, 60);
        const backoffMs = 1000 * 2 ** attempt;
        this.logger.warn(`[API-Basketball] Bị Rate Limit tại ${path}, xoay key và thử lại sau ${backoffMs}ms`);
        await new Promise((resolve) => setTimeout(resolve, backoffMs));
        return this.requestWithRetry<T>(path, params, attempt + 1);
      }
      this.logger.error(`[API-Basketball] Gọi thất bại tới ${path}: ${err?.message}`);
      throw new HttpException(`API-Basketball request failed: ${path}`, status || 502);
    }
  }
}
