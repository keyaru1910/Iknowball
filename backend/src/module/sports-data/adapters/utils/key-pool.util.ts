// src/module/sports-data/adapters/utils/key-pool.util.ts
import { Logger } from '@nestjs/common';

/**
 * Quản lý danh sách API Key (Key Pool) kèm cơ chế Xoay tua (Round-robin) và Chuyển đổi khi lỗi (Failover).
 */
export class KeyPoolManager {
  private readonly logger = new Logger(KeyPoolManager.name);
  private keys: string[] = [];
  private currentIndex = 0;
  private disabledUntil: Map<string, number> = new Map();

  constructor(
    private readonly providerName: string,
    rawKeys: string | string[] | undefined,
  ) {
    this.initKeys(rawKeys);
  }

  private initKeys(rawKeys: string | string[] | undefined) {
    if (!rawKeys) {
      this.keys = [];
      return;
    }

    if (Array.isArray(rawKeys)) {
      this.keys = rawKeys.map((k) => k.trim()).filter((k) => k.length > 0);
    } else {
      this.keys = rawKeys
        .split(',')
        .map((k) => k.trim())
        .filter((k) => k.length > 0);
    }
  }

  /**
   * Lấy API Key hiện tại khả dụng
   */
  getActiveKey(): string {
    if (this.keys.length === 0) return '';
    const now = Date.now();

    // Tìm key đầu tiên không bị giới hạn rate-limit (disabled)
    for (let i = 0; i < this.keys.length; i++) {
      const idx = (this.currentIndex + i) % this.keys.length;
      const key = this.keys[idx];
      const expiry = this.disabledUntil.get(key);

      if (!expiry || now >= expiry) {
        this.currentIndex = idx;
        return key;
      }
    }

    // Nếu tất cả key đều bị tạm khóa, trả về key có thời gian hết hạn sớm nhất
    this.logger.warn(`[${this.providerName}] Toàn bộ ${this.keys.length} API key đều đang bị Rate-Limit!`);
    return this.keys[this.currentIndex];
  }

  /**
   * Xoay sang key tiếp theo trong danh sách
   */
  rotateKey(): string {
    if (this.keys.length <= 1) return this.getActiveKey();
    this.currentIndex = (this.currentIndex + 1) % this.keys.length;
    this.logger.log(`[${this.providerName}] Đã xoay tua sang API key index #${this.currentIndex + 1}/${this.keys.length}`);
    return this.getActiveKey();
  }

  /**
   * Đánh dấu key bị Rate Limit (429) và tạm ngưng sử dụng trong cooldownSeconds
   */
  markKeyRateLimited(key: string, cooldownSeconds = 60): string {
    const until = Date.now() + cooldownSeconds * 1000;
    this.disabledUntil.set(key, until);
    this.logger.warn(
      `[${this.providerName}] API Key ...${key.slice(-6)} bị 429 (Rate Limit). Tạm khóa trong ${cooldownSeconds}s và chuyển key mới.`,
    );
    return this.rotateKey();
  }

  /**
   * Kiểm tra xem có cấu hình API Key nào không
   */
  hasKeys(): boolean {
    return this.keys.length > 0;
  }

  /**
   * Số lượng key trong pool
   */
  getKeyCount(): number {
    return this.keys.length;
  }
}
