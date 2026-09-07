// dto/user-response.dto.ts
// Dùng để loại bỏ passwordHash khỏi mọi response trả về client
export class UserResponseDto {
    id: string;
    email: string;
    fullName: string | null;
    avatarUrl: string | null;
    emailVerifiedAt: Date | null;
    role: string;
    createdAt: Date;

    static fromEntity(user: any): UserResponseDto {
        return {
            id: user.id,
            email: user.email,
            fullName: user.fullName,
            avatarUrl: user.avatarUrl,
            emailVerifiedAt: user.emailVerifiedAt,
            role: user.role?.name ?? user.role,
            createdAt: user.createdAt,
        };
    }
}