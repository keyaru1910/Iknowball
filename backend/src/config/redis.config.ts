import { Logger } from '@nestjs/common';

const logger = new Logger('RedisConfig');

/**
 * Tạo cấu hình kết nối Redis tương thích với BullMQ và ioredis
 * Tự động phân giải REDIS_URL (hỗ trợ rediss:// của Upstash)
 * hoặc các biến REDIS_HOST, REDIS_PORT, REDIS_PASSWORD.
 */
export function getBullMqRedisConnection() {
  const redisUrl = process.env.REDIS_URL;

  if (redisUrl) {
    try {
      const parsed = new URL(redisUrl);
      const isTls = parsed.protocol === 'rediss:';
      logger.log(`[Redis] Sử dụng REDIS_URL kết nối tới ${parsed.hostname}:${parsed.port || 6379} (TLS: ${isTls})`);
      return {
        host: parsed.hostname,
        port: Number(parsed.port) || 6379,
        username: parsed.username ? decodeURIComponent(parsed.username) : undefined,
        password: parsed.password ? decodeURIComponent(parsed.password) : undefined,
        tls: isTls ? { rejectUnauthorized: false } : undefined,
        maxRetriesPerRequest: null,
      };
    } catch (err: any) {
      logger.error(`[Redis] Không thể parse REDIS_URL: ${err.message}`);
    }
  }

  const host = process.env.REDIS_HOST || 'localhost';
  const isUpstashOrTls = process.env.REDIS_TLS === 'true' || host.includes('upstash.io');
  
  logger.log(`[Redis] Sử dụng cấu hình host/port: ${host} (TLS: ${isUpstashOrTls})`);
  return {
    host,
    port: Number(process.env.REDIS_PORT || 6379),
    password: process.env.REDIS_PASSWORD || undefined,
    tls: isUpstashOrTls ? { rejectUnauthorized: false } : undefined,
    maxRetriesPerRequest: null,
  };
}
