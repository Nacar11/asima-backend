import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class AuthUserIdLoginDto {
  @ApiProperty({ example: 'D0001', type: String })
  @IsNotEmpty()
  user_id: string;

  @ApiProperty()
  @IsNotEmpty()
  device_pin: string;
}
