import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const apiKey =
      (req.headers['x-api-key'] as string) ||
      (req.headers['authorization']?.startsWith('Bearer ikb_')
        ? req.headers['authorization'].replace('Bearer ', '')
        : undefined);

    if (!apiKey) {
      throw new UnauthorizedException('Thiếu API Key (truyền qua header X-API-Key)');
    }

    const keyHash = crypto.createHash('sha256').update(apiKey.trim()).digest('hex');

    const keyRecord = await this.prisma.apiKey.findFirst({
      where: {
        keyHash,
        revokedAt: null,
      },
      include: {
        user: {
          include: {
            role: true,
            subscriptions: {
              where: { status: { in: ['ACTIVE', 'TRIALING'] } },
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
          },
        },
      },
    });

    if (!keyRecord || !keyRecord.user || keyRecord.user.status !== 'active') {
      throw new UnauthorizedException('API Key không hợp lệ hoặc đã bị thu hồi');
    }

    // Cập nhật lastUsedAt
    this.prisma.apiKey
      .update({
        where: { id: keyRecord.id },
        data: { lastUsedAt: new Date() },
      })
      .catch(() => {});

    const user = keyRecord.user;
    const roleName = user.role?.name ?? 'user';
    const activeSub = user.subscriptions?.[0];
    let tier: 'free' | 'pro' | 'vip' | 'admin' = 'free';

    if (roleName === 'admin') {
      tier = 'admin';
    } else if (activeSub) {
      tier = ['VIP_MONTHLY', 'VIP_YEARLY'].includes(activeSub.plan) ? 'vip' : 'pro';
    } else if (roleName === 'premium') {
      tier = 'pro';
    }

    req.user = {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: roleName,
      tier,
      apiKeyId: keyRecord.id,
    };

    return true;
  }
}
