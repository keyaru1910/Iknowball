// src/modules/sports-sync/constants/job-names.ts
export const SPORTS_SYNC_QUEUE = 'sports-sync';
export const SPORTS_SYNC_FLOW_PRODUCER = 'sports-sync-flow';
export const SPORTS_SYNC_SCHEDULER_QUEUE = 'sports-sync-scheduler';

export enum SportsSyncJob {
    SYNC_LEAGUES = 'sync-leagues',
    SYNC_TEAMS = 'sync-teams',
    SYNC_MATCHES = 'sync-matches',
    TRIGGER_FULL_SYNC = 'trigger-full-sync', // job của scheduler queue, không phải worker chính
}