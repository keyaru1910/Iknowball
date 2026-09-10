import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateUserStatusDto {
    @IsNotEmpty({ message: 'Trạng thái là bắt buộc' })
    @IsIn(['active', 'banned'], { message: 'Trạng thái chỉ có thể là active hoặc banned' })
    status: 'active' | 'banned';

    @IsOptional()
    @IsString()
    reason?: string;
}

export class UpdateUserRoleDto {
    @IsNotEmpty({ message: 'Role là bắt buộc' })
    @IsIn(['guest', 'user', 'premium', 'admin'], { message: 'Role không hợp lệ' })
    role: string;
}
