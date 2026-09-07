// dto/register.dto.ts
import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';

export class RegisterDto {
    @IsEmail()
    email: string;

    @IsString()
    @MinLength(8, { message: 'Mật khẩu phải có ít nhất 8 ký tự' })
    password: string;

    @IsString()
    @IsOptional()
    fullName?: string;
}