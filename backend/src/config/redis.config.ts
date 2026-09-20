import { Logger } from '@nestjs/common';

const logger = new Logger('RedisConfig');

/**
 * Làm sạch và chuẩn hóa chuỗi Redis URL từ biến môi trường
 */
function sanitizeRedisUrl(rawUrl: string): string {
  let cleaned = rawUrl.trim();

  // Bỏ dấu nháy kép hoặc đơn ở 2 đầu nếu có
  if ((cleaned.startsWith('"') && cleaned.endsWith('"')) || (cleaned.startsWith("'") && cleaned.endsWith("'"))) {
    cleaned = cleaned.slice(1, -1).trim();
  }

  // Bỏ tiền tố "REDIS_URL=" nếu lỡ copy cả tên biến
  if (cleaned.startsWith('REDIS_URL=')) {
    cleaned = cleaned.replace(/^REDIS_URL=/, '').trim();
  }

  // Bỏ tiền tố lệnh CLI nếu lỡ copy "redis-cli --tls -u ..."
  if (cleaned.includes('-u ')) {
    cleaned = cleaned.split('-u ')[1].trim();
  }

  return cleaned;
}

/**
 * Tạo cấu hình kết nối Redis tương thích với BullMQ và ioredis
 * Hỗ trợ tự động chuẩn hóa URL, tự sửa lỗi ký tự đặc biệt, và hỗ trợ TLS cho Upstash
 */
export function getBullMqRedisConnection() {
  const rawRedisUrl = process.env.REDIS_URL;

  if (rawRedisUrl && rawRedisUrl.trim().length > 0) {
    const cleanedUrl = sanitizeRedisUrl(rawRedisUrl);

    // 1. Thử parse với standard URL parser
    try {
      if (cleanedUrl.startsWith('redis://') || cleanedUrl.startsWith('rediss://')) {
        const parsed = new URL(cleanedUrl);
        const isTls = parsed.protocol === 'rediss:' || cleanedUrl.includes('upstash.io');
        
        logger.log(`[Redis] Kết nối tới ${parsed.hostname}:${parsed.port || 6379} (TLS: ${isTls})`);
        return {
          host: parsed.hostname,
          port: Number(parsed.port) || 6379,
          username: parsed.username ? decodeURIComponent(parsed.username) : undefined,
          password: parsed.password ? decodeURIComponent(parsed.password) : undefined,
          tls: isTls ? { rejectUnauthorized: false } : undefined,
          maxRetriesPerRequest: null,
          enableReadyCheck: false,
        };
      }
    } catch (urlErr: any) {
      logger.warn(`[Redis] new URL() thất bại (${urlErr.message}), thử parse dự phòng bằng regex...`);
    }

    // 2. Parse dự phòng bằng Regex nếu URL chứa ký tự đặc biệt trong password
    try {
      const match = cleanedUrl.match(/^(rediss?):\/\/(?:([^:]+):)?([^@]+)@([^:]+):(\d+)/);
      if (match) {
        const [, protocol, username, password, host, port] = match;
        const isTls = protocol === 'rediss' || host.includes('upstash.io');

        logger.log(`[Redis] (Regex Parser) Kết nối tới ${host}:${port} (TLS: ${isTls})`);
        return {
          host,
          port: Number(port) || 6379,
          username: username || undefined,
          password: password || undefined,
          tls: isTls ? { rejectUnauthorized: false } : undefined,
          maxRetriesPerRequest: null,
          enableReadyCheck: false,
        };
      }
    } catch (regexErr: any) {
      logger.error(`[Redis] Regex parse thất bại: ${regexErr.message}`);
    }
  }

  // 3. Fallback host / port
  const host = process.env.REDIS_HOST || 'localhost';
  const isUpstashOrTls = process.env.REDIS_TLS === 'true' || host.includes('upstash.io');

  if (host === 'localhost' || host === '127.0.0.1') {
    logger.warn(`[Redis] CẢNH BÁO: Đang dùng host 'localhost'. Nếu chạy trên Render/Cloud, hãy cấu hình REDIS_URL trong Environment variables!`);
  } else {
    logger.log(`[Redis] Sử dụng cấu hình host: ${host} (TLS: ${isUpstashOrTls})`);
  }

  return {
    host,
    port: Number(process.env.REDIS_PORT || 6379),
    password: process.env.REDIS_PASSWORD || undefined,
    tls: isUpstashOrTls ? { rejectUnauthorized: false } : undefined,
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  };
}
