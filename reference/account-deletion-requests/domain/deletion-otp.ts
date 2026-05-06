import { ApiProperty } from '@nestjs/swagger';

export class DeletionOtp {
  @ApiProperty()
  id: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  otp: string;

  @ApiProperty()
  expires_at: Date;

  @ApiProperty()
  verified: boolean;

  @ApiProperty()
  ip_address: string;

  @ApiProperty()
  created_at: Date;
}
