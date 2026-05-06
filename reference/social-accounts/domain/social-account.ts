import { ApiProperty } from '@nestjs/swagger';
import { User } from '@/users/domain/user';

export class SocialAccount {
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
    example: 'facebook',
  })
  provider: string;

  @ApiProperty({
    type: String,
    example: '1234567890',
  })
  provider_id: string;

  @ApiProperty({
    type: String,
    nullable: true,
  })
  access_token?: string | null;

  @ApiProperty({
    type: String,
    nullable: true,
  })
  refresh_token?: string | null;

  @ApiProperty({
    type: Date,
    nullable: true,
  })
  token_expires_at?: Date | null;

  @ApiProperty({
    type: Object,
    nullable: true,
  })
  profile_data?: Record<string, any> | null;

  @ApiProperty({
    type: Boolean,
    default: true,
  })
  is_verified: boolean;

  @ApiProperty({
    type: () => User,
    nullable: true,
  })
  created_by?: Pick<User, 'id' | 'first_name' | 'last_name'> | null;

  @ApiProperty()
  created_at: Date;

  @ApiProperty({
    type: () => User,
    nullable: true,
  })
  updated_by?: Pick<User, 'id' | 'first_name' | 'last_name'> | null;

  @ApiProperty()
  updated_at: Date;
}
