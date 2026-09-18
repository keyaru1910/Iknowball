import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { SubscriptionPlan } from '@prisma/client';

export class ConfirmSessionDto {
    @IsNotEmpty({ message: 'Session ID là bắt buộc' })
    @IsString()
    sessionId: string;

    @IsOptional()
    @IsEnum(SubscriptionPlan, { message: 'Gói đăng ký không hợp lệ' })
    plan?: SubscriptionPlan;
}
