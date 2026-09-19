import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import { KeyPoolManager } from './utils/key-pool.util';

export interface ZafronixLeagueConfig {
  endpointPrefix: string;
  name: string;
  country: string;
  externalId: string;
}

export const ZAFRONIX_TOP_LEAGUES: ZafronixLeagueConfig[] = [
  { endpointPrefix: 'england/premierleague', name: 'Premier League', country: 'England', externalId: '39' },
  { endpointPrefix: 'spain/laliga', name: 'La Liga', country: 'Spain', externalId: '140' },
  { endpointPrefix: 'italy/seriea', name: 'Serie A', country: 'Italy', externalId: '135' },
  { endpointPrefix: 'germany/bundesliga', name: 'Bundesliga', country: 'Germany', externalId: '78' },
  { endpointPrefix: 'france/ligue1', name: 'Ligue 1', country: 'France', externalId: '61' },
  { endpointPrefix: 'uefa/championsleague', name: 'UEFA Champions League', country: 'Europe', externalId: '2' },
];

@Injectable()
export class ZafronixAdapter {
  private readonly logger = new Logger(ZafronixAdapter.name);
  private readonly client: AxiosInstance;
  private readonly keyPool: KeyPoolManager;

  constructor() {
    this.keyPool = new KeyPoolManager('Zafronix', process.env.ZAFRONIX_API_KEY || 'zsx_free_d56799ca1b5e64a4f67eb1be');
    this.client = axios.create({
      baseURL: 'https://api.zafronix.com',
      timeout: 10000,
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

  async getTournamentDetails(endpointPrefix: string, season?: string): Promise<any> {
    const year = this.normalizeYear(season);
    return this.requestWithRetry(`/${endpointPrefix}/v1/tournaments/${year}`);
  }

  async getMatches(endpointPrefix: string, season?: string): Promise<any[]> {
    const year = this.normalizeYear(season);
    const data = await this.requestWithRetry<{ count?: number; data?: any[] }>(`/${endpointPrefix}/v1/matches`, {
      season: year,
    });
    return data?.data || [];
  }

  async getStandings(endpointPrefix: string, season?: string): Promise<any> {
    const year = this.normalizeYear(season);
    return this.requestWithRetry(`/${endpointPrefix}/v1/standings`, { season: year });
  }

  async getScoreboard(): Promise<{ live?: any[]; upcoming?: any[] }> {
    return this.requestWithRetry('/scoreboard.json');
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
        headers: activeKey ? { 'X-API-Key': activeKey } : {},
      });
      return response.data;
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 429 && attempt <= 3) {
        this.keyPool.markKeyRateLimited(activeKey, 120);
        const backoffMs = 1000 * 2 ** attempt;
        this.logger.warn(`[Zafronix] Rate Limit (429) tại ${path}, xoay key và thử lại sau ${backoffMs}ms`);
        await new Promise((resolve) => setTimeout(resolve, backoffMs));
        return this.requestWithRetry<T>(path, params, attempt + 1);
      }
      this.logger.error(`[Zafronix] Lỗi gọi ${path}: ${err.message}`);
      throw err;
    }
  }
}
