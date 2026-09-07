// api-football.adapter.ts
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
                'x-apisports-key': process.env.API_FOOTBALL_KEY,
            },
        });
    }

    async getLeagues(country?: string): Promise<any[]> {
        return this.requestWithRetry('/leagues', country ? { country } : {});
    }

    async getTeams(leagueId: string, season: string): Promise<any[]> {
        return this.requestWithRetry('/teams', { league: leagueId, season });
    }

    async getFixtures(leagueId: string, season: string): Promise<any[]> {
        return this.requestWithRetry('/fixtures', { league: leagueId, season });
    }

    // Retry + backoff cho rate limit (429) và lỗi mạng tạm thời
    private async requestWithRetry(
        path: string,
        params: Record<string, string>,
        attempt = 1,
    ): Promise<any[]> {
        try {
            const res = await this.client.get(path, { params });
            return res.data?.response ?? [];
        } catch (err: any) {
            const status = err?.response?.status;

            if (status === 429 && attempt <= 3) {
                const backoffMs = 1000 * 2 ** attempt; // 2s, 4s, 8s
                this.logger.warn(`Rate limited on ${path}, retry in ${backoffMs}ms (attempt ${attempt})`);
                await new Promise((r) => setTimeout(r, backoffMs));
                return this.requestWithRetry(path, params, attempt + 1);
            }

            if ((err?.code === 'ECONNABORTED' || (status && status >= 500)) && attempt <= 3) {
                this.logger.warn(`Transient error on ${path}, retry (attempt ${attempt})`);
                await new Promise((r) => setTimeout(r, 1000 * attempt));
                return this.requestWithRetry(path, params, attempt + 1);
            }

            this.logger.error(`Failed to fetch ${path}: ${err?.message}`);
            throw new HttpException(`API-Football request failed: ${path}`, 502);
        }
    }
}