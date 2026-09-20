import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { SubscriptionPlan } from '@prisma/client';

export class CreateVietQrPaymentDto {
    @IsNotEmpty({ message: 'Gói đăng ký là bắt buộc' })
    @IsEnum(SubscriptionPlan, { message: 'Gói đăng ký không hợp lệ' })
    plan: SubscriptionPlan;

    @IsOptional()
    @IsString()
    returnUrl?: string;
}
