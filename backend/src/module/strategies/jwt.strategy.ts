import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../prisma/prisma.service';

import { getJwtSecret } from '../../config/env.validation';

export interface JwtPayload {
    sub: string;
    email: string;
    role: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
    constructor(private prisma: PrismaService) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: getJwtSecret(),
        });
    }

    async validate(payload: JwtPayload) {
        const user = await this.prisma.user.findUnique({
            where: { id: payload.sub },
            include: {
                role: true,
                subscriptions: {
                    where: {
                        status: { in: ['ACTIVE', 'TRIALING'] },
                    },
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                },
            },
        });

        if (!user || user.status !== 'active') {
            throw new UnauthorizedException('Tài khoản không hợp lệ hoặc đã bị khóa');
        }

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

        return {
            id: user.id,
            email: user.email,
            fullName: user.fullName,
            avatarUrl: user.avatarUrl,
            emailVerifiedAt: user.emailVerifiedAt,
            role: roleName,
            tier,
            status: user.status,
        };
    }
}
