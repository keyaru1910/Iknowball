// dto/user-response.dto.ts
// Dùng để loại bỏ passwordHash khỏi mọi response trả về client
export class UserResponseDto {
    id: string;
    email: string;
    fullName: string | null;
    avatarUrl: string | null;
    emailVerifiedAt: Date | null;
    role: string;
    tier: 'free' | 'pro' | 'vip' | 'admin';
    subscription?: {
        plan: string;
        status: string;
        currentPeriodEnd: Date;
    } | null;
    createdAt: Date;

    static fromEntity(user: any): UserResponseDto {
        const roleName = user.role?.name ?? user.role ?? 'user';
        let tier: 'free' | 'pro' | 'vip' | 'admin' = 'free';
        let subscriptionInfo: { plan: string; status: string; currentPeriodEnd: Date } | null = null;

        if (roleName === 'admin') {
            tier = 'admin';
        } else {
            const activeSub = user.subscriptions?.find((sub: any) =>
                ['ACTIVE', 'TRIALING'].includes(sub.status) &&
                (!sub.currentPeriodEnd || new Date(sub.currentPeriodEnd) >= new Date()),
            ) || user.subscriptions?.[0];

            if (activeSub && ['ACTIVE', 'TRIALING'].includes(activeSub.status)) {
                subscriptionInfo = {
                    plan: activeSub.plan,
                    status: activeSub.status,
                    currentPeriodEnd: activeSub.currentPeriodEnd,
                };
                if (['VIP_MONTHLY', 'VIP_YEARLY'].includes(activeSub.plan)) {
                    tier = 'vip';
                } else {
                    tier = 'pro';
                }
            } else if (roleName === 'premium') {
                tier = 'pro';
            } else {
                tier = 'free';
            }
        }

        return {
            id: user.id,
            email: user.email,
            fullName: user.fullName,
            avatarUrl: user.avatarUrl,
            emailVerifiedAt: user.emailVerifiedAt,
            role: roleName,
            tier,
            subscription: subscriptionInfo,
            createdAt: user.createdAt,
        };
    }
}