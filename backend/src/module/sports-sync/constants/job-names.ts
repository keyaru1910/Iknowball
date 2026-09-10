// src/module/sports-sync/constants/job-names.ts

export const SPORTS_SYNC_QUEUE = 'sports-sync';
export const SPORTS_SYNC_FLOW_PRODUCER = 'sports-sync-flow';
export const SPORTS_SYNC_SCHEDULER_QUEUE = 'sports-sync-scheduler';

/**
 * Danh sách định danh các loại Job đồng bộ dữ liệu
 */
export enum SportsSyncJob {
  SYNC_LEAGUES = 'sync-leagues',
  SYNC_TEAMS = 'sync-teams',
  SYNC_MATCHES = 'sync-matches',
  SYNC_STANDINGS = 'sync-standings',
  SYNC_LIVE = 'sync-live',
  SYNC_FINISHED = 'sync-finished',
  SYNC_UPCOMING = 'sync-upcoming',

  // Các job kích hoạt từ Scheduler
  TRIGGER_FULL_SYNC = 'trigger-full-sync',
  TRIGGER_MATCH_DAY_SYNC = 'trigger-match-day-sync',
  TRIGGER_LIVE_SYNC = 'trigger-live-sync',
  TRIGGER_FINISHED_SYNC = 'trigger-finished-sync',
  TRIGGER_UPCOMING_SYNC = 'trigger-upcoming-sync',
}