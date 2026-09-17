import { IsBoolean, IsInt, IsOptional, Max, Min } from 'class-validator';

export class UpdateAlertPreferenceDto {
    @IsOptional()
    @IsBoolean()
    oddsAlertEnabled?: boolean;

    @IsOptional()
    @IsBoolean()
    predictionShiftEnabled?: boolean;

    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(50)
    minThresholdPercent?: number;

    @IsOptional()
    @IsBoolean()
    notifyInApp?: boolean;

    @IsOptional()
    @IsBoolean()
    notifyTelegram?: boolean;

    @IsOptional()
    @IsBoolean()
    notifyEmail?: boolean;
}
