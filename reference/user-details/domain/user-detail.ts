import { ApiProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import { User } from '@/users/domain/user';

export enum GenderEnum {
  MALE = 'Male',
  FEMALE = 'Female',
  OTHER = 'Other',
  PREFER_NOT_TO_SAY = 'PreferNotToSay',
}

export class UserDetail {
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
    nullable: true,
    example: 'johndoe123',
  })
  username?: string | null;

  @ApiProperty({
    enum: GenderEnum,
    nullable: true,
  })
  gender?: GenderEnum | null;

  @ApiProperty({
    type: Date,
    nullable: true,
  })
  date_of_birth?: Date | null;

  @ApiProperty({
    type: String,
    nullable: true,
  })
  bio?: string | null;

  @ApiProperty({
    type: String,
    nullable: true,
    example:
      'https://minio-host/media/avatars/users/123/avatar-1719999999999.jpg',
    description: 'Full URL to the user profile picture',
  })
  profile_picture?: string | null;

  @Exclude({ toPlainOnly: true })
  profile_picture_path?: string | null;

  @ApiProperty({
    type: String,
    nullable: true,
    example: '+1234567890',
  })
  phone?: string | null;

  @ApiProperty({
    type: String,
    nullable: true,
    example: '123 Main St, City, Country',
  })
  address?: string | null;

  @ApiProperty({
    type: Date,
    nullable: true,
  })
  phone_verified_at?: Date | null;

  @ApiProperty({
    type: Date,
    nullable: true,
  })
  email_verified_at?: Date | null;

  @ApiProperty({
    type: String,
    default: 'UTC',
  })
  timezone: string;

  @ApiProperty({
    type: String,
    default: 'en_US',
  })
  locale: string;

  @ApiProperty({
    type: Object,
    nullable: true,
  })
  notification_preferences?: Record<string, any> | null;

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
