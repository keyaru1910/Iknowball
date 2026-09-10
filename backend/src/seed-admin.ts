/**
 * Script tạo tài khoản admin mặc định cho iKnowBall.
 * Chạy bằng: node dist/seed-admin.js
 * Hoặc: npm run seed:admin
 *
 * Thông tin đăng nhập sau khi seed:
 *   Email:    admin@iknowball.com
 *   Password: Admin@123456
 */

import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const ADMIN_EMAIL = 'admin@iknowball.com';
const ADMIN_PASSWORD = 'Admin@123456';
const ADMIN_FULL_NAME = 'iKnowBall Admin';
const BCRYPT_COST = 12;

async function seedAdmin() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
        throw new Error('DATABASE_URL chưa được cấu hình trong .env');
    }

    const adapter = new PrismaPg({ connectionString });
    const prisma = new PrismaClient({ adapter } as any);

    try {
        console.log('🌱 Đang tạo tài khoản admin...\n');

        // 1. Đảm bảo role "admin" tồn tại
        let adminRole = await prisma.role.findUnique({ where: { name: 'admin' } });
        if (!adminRole) {
            adminRole = await prisma.role.create({
                data: {
                    name: 'admin',
                    permissions: { canManageSystem: true, canTriggerSync: true },
                },
            });
            console.log('✅ Đã tạo role "admin"');
        } else {
            console.log('ℹ️  Role "admin" đã tồn tại');
        }

        // 2. Kiểm tra xem admin đã tồn tại chưa
        const existingAdmin = await prisma.user.findUnique({
            where: { email: ADMIN_EMAIL },
            include: { role: true },
        });

        if (existingAdmin) {
            console.log(`ℹ️  Tài khoản admin đã tồn tại: ${ADMIN_EMAIL}`);
            console.log(`   Role hiện tại: ${existingAdmin.role?.name}`);

            // Nếu chưa phải admin thì cập nhật role
            if (existingAdmin.role?.name !== 'admin') {
                await prisma.user.update({
                    where: { email: ADMIN_EMAIL },
                    data: { roleId: adminRole.id },
                });
                console.log('✅ Đã cập nhật role thành "admin"');
            }
            return;
        }

        // 3. Tạo tài khoản admin mới
        const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, BCRYPT_COST);

        const admin = await prisma.user.create({
            data: {
                email: ADMIN_EMAIL,
                passwordHash,
                fullName: ADMIN_FULL_NAME,
                roleId: adminRole.id,
                status: 'active',
                // Admin không cần verify email
                emailVerifiedAt: new Date(),
            },
            include: { role: true },
        });

        console.log('\n🎉 Tạo tài khoản admin thành công!');
        console.log('─────────────────────────────────────');
        console.log(`   ID:       ${admin.id}`);
        console.log(`   Email:    ${admin.email}`);
        console.log(`   Tên:      ${admin.fullName}`);
        console.log(`   Role:     ${admin.role?.name}`);
        console.log(`   Password: ${ADMIN_PASSWORD}`);
        console.log('─────────────────────────────────────');
        console.log('\n⚠️  Hãy đổi mật khẩu sau khi đăng nhập lần đầu!');
    } finally {
        await prisma.$disconnect();
    }
}

seedAdmin().catch((e) => {
    console.error('❌ Lỗi khi seed admin:', e.message ?? e);
    process.exit(1);
});
