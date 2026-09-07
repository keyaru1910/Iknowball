// src/modules/sports-sync/utils/hash.util.ts
import { createHash } from 'crypto';

export function computeContentHash(payload: Record<string, any>): string {
    const sorted = Object.keys(payload)
        .sort()
        .reduce((acc, key) => ({ ...acc, [key]: payload[key] }), {} as Record<string, any>);
    return createHash('sha256').update(JSON.stringify(sorted)).digest('hex');
}