import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserResponseDto } from '../dto/user-response.dto';

@Injectable()
export class UserService {
    constructor(private prisma: PrismaService) {}

    async findById(id: string): Promise<UserResponseDto> {
        const user = await this.prisma.user.findUnique({
            where: { id },
            include: { role: true },
        });
        if (!user) {
            throw new NotFoundException('Không tìm thấy người dùng');
        }
        return UserResponseDto.fromEntity(user);
    }

    async updateProfile(id: string, data: { fullName?: string; avatarUrl?: string }) {
        const user = await this.prisma.user.update({
            where: { id },
            data,
            include: { role: true },
        });
        return UserResponseDto.fromEntity(user);
    }
}
