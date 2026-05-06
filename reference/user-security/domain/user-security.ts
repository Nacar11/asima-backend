import { ApiProperty } from '@nestjs/swagger';
import { User } from '@/users/domain/user';

export enum MfaTypeEnum {
  TOTP = 'TOTP',
  SMS = 'SMS',
  EMAIL = 'Email',
  NONE = 'None',
}

export class UserSecurity {
  @ApiProperty({
    type: Number,
  })
  id: number;

  @ApiProperty({
    type: Number,
  })
  user_id: number;

  @ApiProperty({
    type: Date,
    nullable: true,
  })
  password_changed_at?: Date | null;

  @ApiProperty({
    type: Date,
    nullable: true,
  })
  password_expires_at?: Date | null;

  @ApiProperty({
    type: Boolean,
    default: false,
  })
  require_password_change: boolean;

  @ApiProperty({
    type: Number,
    default: 0,
  })
  failed_login_attempts: number;

  @ApiProperty({
    type: Date,
    nullable: true,
  })
  locked_until?: Date | null;

  @ApiProperty({
    type: String,
    nullable: true,
  })
  last_login_ip?: string | null;

  @ApiProperty({
    type: Boolean,
    default: false,
  })
  mfa_enabled: boolean;

  @ApiProperty({
    enum: MfaTypeEnum,
    default: MfaTypeEnum.NONE,
  })
  mfa_type: MfaTypeEnum;

  @ApiProperty({
    type: String,
    nullable: true,
  })
  mfa_secret?: string | null;

  @ApiProperty({
    type: String,
    nullable: true,
  })
  mfa_backup_codes?: string | null;

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
