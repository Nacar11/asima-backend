import { ApiProperty } from '@nestjs/swagger';

export class PasswordResetToken {
  @ApiProperty({
    type: Number,
  })
  id: number;

  @ApiProperty({
    type: Number,
  })
  user_id: number;

  @ApiProperty({
    type: String,
  })
  token: string;

  @ApiProperty({
    type: String,
    nullable: true,
    example: '123456',
  })
  otp?: string | null;

  @ApiProperty({
    type: Date,
  })
  expires_at: Date;

  @ApiProperty({
    type: Date,
    nullable: true,
  })
  used_at?: Date | null;

  @ApiProperty({
    type: String,
    nullable: true,
  })
  ip_address?: string | null;

  @ApiProperty({
    type: String,
    nullable: true,
  })
  user_agent?: string | null;

  @ApiProperty({
    type: Object,
    nullable: true,
    description: 'Additional metadata for the token (e.g., email change info)',
  })
  metadata?: Record<string, any> | null;

  @ApiProperty()
  created_at: Date;
}
