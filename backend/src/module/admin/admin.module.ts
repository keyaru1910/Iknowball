import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { PrismaService } from '../prisma/prisma.service';
import { NewsModule } from '../news/news.module';

@Module({
    controllers: [AdminController],
    imports: [NewsModule],
    providers: [AdminService, PrismaService],
    exports: [AdminService],
})
export class AdminModule {}
