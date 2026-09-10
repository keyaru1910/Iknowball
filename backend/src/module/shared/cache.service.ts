// src/module/shared/cache.service.ts
import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { createClient, RedisClientType } from 'redis';

@Injectable()
export class CacheService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CacheService.name);
  private client: RedisClientType | null = null;
  private isConnected = false;

  async onModuleInit() {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    try {
      this.client = createClient({
        url: redisUrl,
          socket: {
          // Cache là tùy chọn ở môi trường local: nếu Redis chưa chạy thì
          // trả về dữ liệu trực tiếp từ PostgreSQL thay vì chặn app khởi động.
          reconnectStrategy: () => false,
        },
      });

      this.client.on('error', (err) => {
        this.logger.warn(`Redis client error: ${err.message}`);
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        this.isConnected = true;
        this.logger.log('Connected to Redis successfully');
      });

      await this.client.connect();
    } catch (err: any) {
      this.logger.warn(`Could not connect to Redis (${redisUrl}): ${err.message}. Running without Redis cache.`);
      this.isConnected = false;
    }
  }

  /**
   * Kiểm tra tình trạng kết nối Redis
   */
  async ping(): Promise<boolean> {
    if (!this.client || !this.isConnected) return false;
    try {
      const reply = await this.client.ping();
      return reply === 'PONG';
    } catch {
      return false;
    }
  }

  get connected(): boolean {
    return this.isConnected;
  }


  async onModuleDestroy() {
    if (this.client && this.isConnected) {
      try {
        await this.client.quit();
      } catch (err) {
        // ignore on exit
      }
    }
  }

  /**
   * Lấy giá trị từ Cache theo key
   */
  async get<T>(key: string): Promise<T | null> {
    if (!this.client || !this.isConnected) return null;
    try {
      const data = await this.client.get(key);
      if (!data) return null;
      return JSON.parse(data) as T;
    } catch (err: any) {
      this.logger.warn(`Cache GET error for key ${key}: ${err.message}`);
      return null;
    }
  }

  /**
   * Lưu giá trị vào Cache kèm TTL (giây)
   */
  async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    if (!this.client || !this.isConnected) return;
    try {
      const stringValue = JSON.stringify(value);
      if (ttlSeconds && ttlSeconds > 0) {
        await this.client.set(key, stringValue, { EX: ttlSeconds });
      } else {
        await this.client.set(key, stringValue);
      }
    } catch (err: any) {
      this.logger.warn(`Cache SET error for key ${key}: ${err.message}`);
    }
  }

  /**
   * Xóa một key trong Cache
   */
  async del(key: string): Promise<void> {
    if (!this.client || !this.isConnected) return;
    try {
      await this.client.del(key);
    } catch (err: any) {
      this.logger.warn(`Cache DEL error for key ${key}: ${err.message}`);
    }
  }

  /**
   * Xóa danh sách key khớp với pattern (vd: "matches:*")
   */
  async delByPattern(pattern: string): Promise<void> {
    if (!this.client || !this.isConnected) return;
    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(keys);
      }
    } catch (err: any) {
      this.logger.warn(`Cache delByPattern error for pattern ${pattern}: ${err.message}`);
    }
  }

  /**
   * Triển khai Cache-aside pattern:
   * Nếu có trong cache thì trả về ngay (hit).
   * Nếu không có (miss), gọi hàm fetcherFn(), lưu kết quả vào cache với TTL rồi trả về.
   */
  async getOrSet<T>(key: string, ttlSeconds: number, fetcherFn: () => Promise<T>): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const freshData = await fetcherFn();
    if (freshData !== undefined && freshData !== null) {
      await this.set(key, freshData, ttlSeconds);
    }
    return freshData;
  }
}
