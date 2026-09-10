import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { SubscriptionPlan } from '@prisma/client';

export class CreateCheckoutSessionDto {
    @IsNotEmpty({ message: 'Gói đăng ký là bắt buộc' })
    @IsEnum(SubscriptionPlan, { message: 'Gói đăng ký không hợp lệ' })
    plan: SubscriptionPlan;

    @IsOptional()
    @IsString()
    successUrl?: string;

    @IsOptional()
    @IsString()
    cancelUrl?: string;
}
