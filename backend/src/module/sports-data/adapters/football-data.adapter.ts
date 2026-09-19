// src/module/sports-data/adapters/football-data.adapter.ts
import { Injectable, Logger, HttpException } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import { KeyPoolManager } from './utils/key-pool.util';

export interface FootballDataLeagueConfig {
  code: string;
  name: string;
  country: string;
  externalId: string;
}

export const FOOTBALL_DATA_LEAGUES: FootballDataLeagueConfig[] = [
  { code: 'PL', name: 'Premier League', country: 'England', externalId: '39' },
  { code: 'PD', name: 'La Liga', country: 'Spain', externalId: '140' },
  { code: 'SA', name: 'Serie A', country: 'Italy', externalId: '135' },
  { code: 'BL1', name: 'Bundesliga', country: 'Germany', externalId: '78' },
  { code: 'FL1', name: 'Ligue 1', country: 'France', externalId: '61' },
  { code: 'CL', name: 'UEFA Champions League', country: 'Europe', externalId: '2' },
];

@Injectable()
export class FootballDataAdapter {
  private readonly logger = new Logger(FootballDataAdapter.name);
  private readonly client: AxiosInstance;
  private readonly keyPool: KeyPoolManager;

  constructor() {
    this.keyPool = new KeyPoolManager('FootballData', process.env.FOOTBALL_DATA_API_KEY || '');
    this.client = axios.create({
      baseURL: 'https://api.football-data.org/v4',
      timeout: 9000,
    });
  }

  private normalizeYear(season?: string): number {
    if (!season) return new Date().getFullYear();
    const clean = season.trim();
    if (clean.includes('-')) return parseInt(clean.split('-')[0], 10);
    if (clean.includes('/')) {
      const parts = clean.split('/');
      return parts[0].length === 2 ? parseInt(`20${parts[0]}`, 10) : parseInt(parts[0], 10);
    }
    return parseInt(clean, 10) || new Date().getFullYear();
  }

  async getMatches(competitionCode: string, season?: string): Promise<any[]> {
    const year = this.normalizeYear(season);
    const res = await this.requestWithRetry<{ matches?: any[] }>(`/competitions/${competitionCode}/matches`, {
      season: year,
    });
    return res?.matches || [];
  }

  async getTeams(competitionCode: string, season?: string): Promise<any[]> {
    const year = this.normalizeYear(season);
    const res = await this.requestWithRetry<{ teams?: any[] }>(`/competitions/${competitionCode}/teams`, {
      season: year,
    });
    return res?.teams || [];
  }

  async getStandings(competitionCode: string, season?: string): Promise<any[]> {
    const year = this.normalizeYear(season);
    const res = await this.requestWithRetry<{ standings?: any[] }>(`/competitions/${competitionCode}/standings`, {
      season: year,
    });
    return res?.standings || [];
  }

  private async requestWithRetry<T = any>(
    path: string,
    params: Record<string, any> = {},
    attempt = 1,
  ): Promise<T> {
    const activeKey = this.keyPool.getActiveKey();
    try {
      const response = await this.client.get(path, {
        params,
        headers: activeKey ? { 'X-Auth-Token': activeKey } : {},
      });
      return response.data;
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 429 && attempt <= 3) {
        this.keyPool.markKeyRateLimited(activeKey, 60);
        const backoffMs = 1000 * 2 ** attempt;
        this.logger.warn(`[FootballData] Rate Limit (429) tại ${path}, xoay key và thử lại sau ${backoffMs}ms`);
        await new Promise((resolve) => setTimeout(resolve, backoffMs));
        return this.requestWithRetry<T>(path, params, attempt + 1);
      }
      this.logger.error(`[FootballData] Lỗi gọi ${path}: ${err?.message}`);
      throw new HttpException(`FootballData request failed: ${path}`, status || 502);
    }
  }
}
