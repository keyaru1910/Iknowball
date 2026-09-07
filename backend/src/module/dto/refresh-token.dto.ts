import { IsString, IsNotEmpty } from 'class-validator';

export class RefreshTokenDto {
    @IsString()
    @IsNotEmpty({ message: 'Refresh token không được để trống' })
    refreshToken: string;
}
