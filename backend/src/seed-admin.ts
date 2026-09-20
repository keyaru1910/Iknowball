/**
 * Script tạo và cập nhật tài khoản Admin, Pro và VIP mặc định cho iKnowBall.
 * Chạy bằng: npm run seed:admin
 *
 * Danh sách tài khoản:
 * 1. Admin:
 *    Email:    admin@iknowball.com
 *    Password: Admin@123456
 *    Role:     admin (Quyền quản trị toàn hệ thống)
 *
 * 2. PRO (Vô thời hạn):
 *    Email:    pro@iknowball.com
 *    Password: Pro@123456
 *    Gói:      PRO_YEARLY (Hạn dùng: 31/12/2099)
 *
 * 3. VIP (Vô thời hạn):
 *    Email:    vip@iknowball.com
 *    Password: Vip@123456
 *    Gói:      VIP_YEARLY (Hạn dùng: 31/12/2099)
 */

import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, SubscriptionPlan, SubscriptionStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const BCRYPT_COST = 12;
const LIFETIME_EXPIRY = new Date('2099-12-31T23:59:59.999Z');

async function seedAccounts() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
        throw new Error('DATABASE_URL chưa được cấu hình trong .env');
    }

    const adapter = new PrismaPg({ connectionString });
    const prisma = new PrismaClient({ adapter } as any);

    try {
        console.log('🌱 Đang khởi tạo/cập nhật tài khoản Admin, Pro và VIP...\n');

        // 1. Đảm bảo các Roles cơ bản tồn tại
        const roleNames = ['admin', 'user', 'premium', 'guest'];
        const roles: Record<string, any> = {};

        for (const roleName of roleNames) {
            let role = await prisma.role.findUnique({ where: { name: roleName } });
            if (!role) {
                role = await prisma.role.create({
                    data: {
                        name: roleName,
                        permissions: roleName === 'admin'
                            ? { canManageSystem: true, canTriggerSync: true }
                            : { canViewMatches: true, canPredictFree: true },
                    },
                });
                console.log(`✅ Đã tạo role "${roleName}"`);
            }
            roles[roleName] = role;
        }

        // 2. Tài khoản ADMIN
        const adminEmail = 'admin@iknowball.com';
        const adminPassword = 'Admin@123456';
        const adminPasswordHash = await bcrypt.hash(adminPassword, BCRYPT_COST);

        const adminUser = await prisma.user.upsert({
            where: { email: adminEmail },
            update: {
                passwordHash: adminPasswordHash,
                roleId: roles.admin.id,
                status: 'active',
                emailVerifiedAt: new Date(),
                fullName: 'iKnowBall Admin',
            },
            create: {
                email: adminEmail,
                passwordHash: adminPasswordHash,
                fullName: 'iKnowBall Admin',
                roleId: roles.admin.id,
                status: 'active',
                emailVerifiedAt: new Date(),
            },
            include: { role: true },
        });

        console.log('👑 [ADMIN]');
        console.log(`   Email:    ${adminUser.email}`);
        console.log(`   Password: ${adminPassword}`);
        console.log(`   Role:     ${adminUser.role.name}\n`);

        // 3. Tài khoản PRO (Vô thời hạn)
        const proEmail = 'pro@iknowball.com';
        const proPassword = 'Pro@123456';
        const proPasswordHash = await bcrypt.hash(proPassword, BCRYPT_COST);

        const proUser = await prisma.user.upsert({
            where: { email: proEmail },
            update: {
                passwordHash: proPasswordHash,
                roleId: roles.user.id,
                status: 'active',
                emailVerifiedAt: new Date(),
                fullName: 'iKnowBall Pro Tester',
            },
            create: {
                email: proEmail,
                passwordHash: proPasswordHash,
                fullName: 'iKnowBall Pro Tester',
                roleId: roles.user.id,
                status: 'active',
                emailVerifiedAt: new Date(),
            },
        });

        // Xử lý gói subscription PRO vô thời hạn
        const existingProSub = await prisma.subscription.findFirst({
            where: { userId: proUser.id },
        });

        if (existingProSub) {
            await prisma.subscription.update({
                where: { id: existingProSub.id },
                data: {
                    plan: SubscriptionPlan.PRO_YEARLY,
                    status: SubscriptionStatus.ACTIVE,
                    currentPeriodStart: new Date(),
                    currentPeriodEnd: LIFETIME_EXPIRY,
                    cancelAtPeriodEnd: false,
                },
            });
        } else {
            await prisma.subscription.create({
                data: {
                    userId: proUser.id,
                    stripeCustomerId: `cus_pro_lifetime_${proUser.id.substring(0, 8)}`,
                    stripeSubscriptionId: `sub_pro_lifetime_${proUser.id.substring(0, 8)}`,
                    stripePriceId: 'price_pro_yearly_test',
                    plan: SubscriptionPlan.PRO_YEARLY,
                    status: SubscriptionStatus.ACTIVE,
                    currentPeriodStart: new Date(),
                    currentPeriodEnd: LIFETIME_EXPIRY,
                    cancelAtPeriodEnd: false,
                },
            });
        }

        console.log('⚡ [PRO - Vô thời hạn]');
        console.log(`   Email:    ${proEmail}`);
        console.log(`   Password: ${proPassword}`);
        console.log(`   Hạn dùng: ${LIFETIME_EXPIRY.toISOString()}\n`);

        // 4. Tài khoản VIP (Vô thời hạn)
        const vipEmail = 'vip@iknowball.com';
        const vipPassword = 'Vip@123456';
        const vipPasswordHash = await bcrypt.hash(vipPassword, BCRYPT_COST);

        const vipUser = await prisma.user.upsert({
            where: { email: vipEmail },
            update: {
                passwordHash: vipPasswordHash,
                roleId: roles.user.id,
                status: 'active',
                emailVerifiedAt: new Date(),
                fullName: 'iKnowBall VIP Tester',
            },
            create: {
                email: vipEmail,
                passwordHash: vipPasswordHash,
                fullName: 'iKnowBall VIP Tester',
                roleId: roles.user.id,
                status: 'active',
                emailVerifiedAt: new Date(),
            },
        });

        // Xử lý gói subscription VIP vô thời hạn
        const existingVipSub = await prisma.subscription.findFirst({
            where: { userId: vipUser.id },
        });

        if (existingVipSub) {
            await prisma.subscription.update({
                where: { id: existingVipSub.id },
                data: {
                    plan: SubscriptionPlan.VIP_YEARLY,
                    status: SubscriptionStatus.ACTIVE,
                    currentPeriodStart: new Date(),
                    currentPeriodEnd: LIFETIME_EXPIRY,
                    cancelAtPeriodEnd: false,
                },
            });
        } else {
            await prisma.subscription.create({
                data: {
                    userId: vipUser.id,
                    stripeCustomerId: `cus_vip_lifetime_${vipUser.id.substring(0, 8)}`,
                    stripeSubscriptionId: `sub_vip_lifetime_${vipUser.id.substring(0, 8)}`,
                    stripePriceId: 'price_vip_yearly_test',
                    plan: SubscriptionPlan.VIP_YEARLY,
                    status: SubscriptionStatus.ACTIVE,
                    currentPeriodStart: new Date(),
                    currentPeriodEnd: LIFETIME_EXPIRY,
                    cancelAtPeriodEnd: false,
                },
            });
        }

        console.log('🌟 [VIP - Vô thời hạn]');
        console.log(`   Email:    ${vipEmail}`);
        console.log(`   Password: ${vipPassword}`);
        console.log(`   Hạn dùng: ${LIFETIME_EXPIRY.toISOString()}\n`);

        console.log('🎉 Đã cập nhật thành công tất cả tài khoản test!');
    } finally {
        await prisma.$disconnect();
    }
}

seedAccounts().catch((e) => {
    console.error('❌ Lỗi khi seed tài khoản:', e.message ?? e);
    process.exit(1);
});
