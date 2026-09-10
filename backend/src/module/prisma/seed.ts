import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Bắt đầu khởi tạo dữ liệu mẫu (Seed)...');

  // 1. Tạo Roles mặc định nếu chưa tồn tại
  const roles = [
    { name: 'guest', permissions: { canViewMatches: true } },
    { name: 'user', permissions: { canViewMatches: true, canPredictFree: true } },
    { name: 'premium', permissions: { canViewMatches: true, canPredictFree: true, canViewAdvancedAnalytics: true } },
    { name: 'admin', permissions: { canManageSystem: true, canTriggerSync: true } },
  ];

  for (const role of roles) {
    const existingRole = await prisma.role.findUnique({
      where: { name: role.name },
    });
    if (!existingRole) {
      await prisma.role.create({
        data: role,
      });
      console.log(`  + Đã tạo Role: ${role.name}`);
    }
  }

  // 2. Tạo Sports mặc định nếu chưa tồn tại
  const sports = [
    { name: 'football' },
    { name: 'basketball' },
  ];

  for (const sport of sports) {
    const existingSport = await prisma.sport.findUnique({
      where: { name: sport.name },
    });
    if (!existingSport) {
      await prisma.sport.create({
        data: sport,
      });
      console.log(`  + Đã tạo Sport: ${sport.name}`);
    }
  }

  console.log('✅ Seed dữ liệu ban đầu hoàn tất!');
}

main()
  .catch((e) => {
    console.error('❌ Lỗi khi seed dữ liệu:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
