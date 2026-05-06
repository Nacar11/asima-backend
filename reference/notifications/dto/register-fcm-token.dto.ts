import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, Length } from 'class-validator';

export enum DeviceTypeEnum {
  MOBILE = 'mobile',
  WEB = 'web',
  TABLET = 'tablet',
}

export class RegisterFcmTokenDto {
  @ApiProperty({
    description: 'FCM device token',
    example: 'cXk2F8DxQhKJ...',
  })
  @IsString()
  @Length(1, 500)
  device_token: string;

  @ApiPropertyOptional({
    enum: DeviceTypeEnum,
    default: DeviceTypeEnum.MOBILE,
    description: 'Type of device',
  })
  @IsOptional()
  @IsEnum(DeviceTypeEnum)
  device_type?: DeviceTypeEnum;

  @ApiPropertyOptional({
    description: 'Device name/identifier',
    example: 'iPhone 15 Pro',
  })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  device_name?: string;
}

export class DeactivateFcmTokenDto {
  @ApiProperty({
    description: 'FCM device token to deactivate',
  })
  @IsString()
  @Length(1, 500)
  device_token: string;
}
