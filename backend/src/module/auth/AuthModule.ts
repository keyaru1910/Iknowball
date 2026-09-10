// auth.module.ts
import { JwtModule } from '@nestjs/jwt';
import { Module } from '@nestjs/common';

@Module({
    imports: [
        JwtModule.register({}), // dùng JwtService.sign() với options riêng mỗi lần gọi
        // ...
    ],
})
export class AuthModule { }