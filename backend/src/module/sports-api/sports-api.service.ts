// src/module/sports-api/sports-api.service.ts
import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { RateLimiterService } from './rate-limiter.service';

@Injectable()
export class SportsApiService {
    private readonly logger = new Logger(SportsApiService.name);
    private readonly baseUrl = 'https://v3.football.api-sports.io';
    private readonly authHeaders = {
        'x-apisports-key': process.env.API_FOOTBALL_KEY || '',
    };

    constructor(private readonly rateLimiter: RateLimiterService) { }

    private async callWithRetry<T>(fn: () => Promise<T>, context: string, maxAttempts = 3): Promise<T> {
        let lastError: any;

        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                return await this.rateLimiter.schedule(() =>
                    Promise.race([
                        fn(),
                        new Promise<never>((_, reject) =>
                            setTimeout(() => reject(new Error(`Timeout 8s: ${context}`)), 8000),
                        ),
                    ]),
                );
            } catch (err: any) {
                lastError = err;
                const isRateLimit = err?.response?.status === 429;
                const retryAfterMs = isRateLimit ? this.parseRetryAfter(err) : null;
                const backoffMs = retryAfterMs ?? 2 ** attempt * 1000; // 2s, 4s, 8s

                this.logger.warn(
                    `[${context}] attempt ${attempt}/${maxAttempts} failed` +
                    (isRateLimit ? ' (429 rate limit)' : '') +
                    ` — retry sau ${backoffMs}ms. Error: ${err.message}`,
                );

                if (attempt === maxAttempts) break;
                await this.sleep(backoffMs);
            }
        }
        throw lastError;
    }

    private parseRetryAfter(err: any): number | null {
        const header = err?.response?.headers?.['retry-after'];
        return header ? Number(header) * 1000 : null;
    }

    private sleep(ms: number) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    private mapLeagues(data: any) {
        return data?.response ?? [];
    }

    async fetchLeagues() {
        return this.callWithRetry(
            async () => {
                const { data } = await axios.get(`${this.baseUrl}/leagues`, { headers: this.authHeaders });
                return this.mapLeagues(data);
            },
            'fetchLeagues',
        );
    }
}
