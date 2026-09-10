import { Logger } from '@nestjs/common';

const logger = new Logger('EnvironmentValidation');

/**
 * Danh sách các biến môi trường bắt buộc phải có khi chạy trên production
 */
const REQUIRED_PRODUCTION_ENVS = [
    'DATABASE_URL',
    'JWT_SECRET',
    'JWT_REFRESH_SECRET',
    'EMAIL_VERIFY_SECRET',
    'FRONTEND_URL',
] as const;

/**
 * Danh sách các biến tùy chọn khuyến nghị
 */
const RECOMMENDED_PAYMENT_ENVS = [
    'STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET',
    'STRIPE_PRO_MONTHLY_PRICE_ID',
    'STRIPE_PRO_YEARLY_PRICE_ID',
    'STRIPE_VIP_MONTHLY_PRICE_ID',
] as const;

export function validateEnvironment(): void {
    const isProduction = process.env.NODE_ENV === 'production';

    // 1. Kiểm tra biến môi trường bắt buộc trên production
    if (isProduction) {
        const missingProductionEnvs: string[] = [];
        for (const envKey of REQUIRED_PRODUCTION_ENVS) {
            if (!process.env[envKey] || process.env[envKey]?.trim() === '') {
                missingProductionEnvs.push(envKey);
            }
        }

        if (missingProductionEnvs.length > 0) {
            logger.error(
                `[FATAL] Thiếu các biến môi trường bắt buộc trên production: ${missingProductionEnvs.join(', ')}`,
            );
            process.exit(1);
        }

        // Kiểm tra xem secret có bị dùng giá trị mặc định/yếu không
        const weakSecrets = ['fallback_jwt_secret', 'fallback_jwt_refresh_secret', 'verify_secret', 'secret'];
        if (weakSecrets.includes(process.env.JWT_SECRET || '')) {
            logger.error('[FATAL] JWT_SECRET đang dùng giá trị fallback/yếu không an toàn trên production!');
            process.exit(1);
        }
    } else {
        // Cảnh báo ở môi trường development nếu thiếu biến quan trọng
        for (const envKey of REQUIRED_PRODUCTION_ENVS) {
            if (!process.env[envKey]) {
                logger.warn(`[DEV WARNING] Biến môi trường ${envKey} chưa được cấu hình, đang dùng giá trị mặc định.`);
            }
        }
    }

    // 2. Kiểm tra các biến Stripe cho tính năng thanh toán
    const missingStripeEnvs = RECOMMENDED_PAYMENT_ENVS.filter(env => !process.env[env]);
    if (missingStripeEnvs.length > 0) {
        logger.warn(
            `[STRIPE WARNING] Các biến Stripe chưa cấu hình: ${missingStripeEnvs.join(', ')}. Chế độ thanh toán Stripe sẽ ở dạng Mock/Stub hoặc cần cấu hình .env.`,
        );
    }

    logger.log(`Khởi tạo môi trường hoàn tất: NODE_ENV=${process.env.NODE_ENV || 'development'}`);
}

/**
 * Lấy JWT Secret an toàn, quăng lỗi nếu ở production mà không có
 */
export function getJwtSecret(): string {
    const secret = process.env.JWT_SECRET;
    if (!secret && process.env.NODE_ENV === 'production') {
        throw new Error('JWT_SECRET is missing in production');
    }
    return secret || 'dev_jwt_secret_fallback_only_for_local_development_12345';
}

/**
 * Lấy JWT Refresh Secret an toàn
 */
export function getJwtRefreshSecret(): string {
    const secret = process.env.JWT_REFRESH_SECRET;
    if (!secret && process.env.NODE_ENV === 'production') {
        throw new Error('JWT_REFRESH_SECRET is missing in production');
    }
    return secret || 'dev_jwt_refresh_secret_fallback_only_for_local_development_67890';
}

/**
 * Lấy Email Verify Secret an toàn
 */
export function getEmailVerifySecret(): string {
    const secret = process.env.EMAIL_VERIFY_SECRET;
    if (!secret && process.env.NODE_ENV === 'production') {
        throw new Error('EMAIL_VERIFY_SECRET is missing in production');
    }
    return secret || 'dev_email_verify_secret_fallback_only_for_local_development_13579';
}
