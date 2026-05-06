import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsDateString,
  IsEnum,
  IsObject,
} from 'class-validator';
import { GenderEnum } from '@/user-details/domain/user-detail';

export class UpdateUserDetailDto {
  @ApiPropertyOptional({
    type: String,
    description: 'Username',
    example: 'johndoe123',
  })
  @IsOptional()
  @IsString()
  username?: string;

  @ApiPropertyOptional({
    enum: GenderEnum,
    description: 'Gender',
  })
  @IsOptional()
  @IsEnum(GenderEnum)
  gender?: GenderEnum;

  @ApiPropertyOptional({
    type: Date,
    description: 'Date of birth',
  })
  @IsOptional()
  @IsDateString()
  date_of_birth?: Date;

  @ApiPropertyOptional({
    type: String,
    description: 'Bio',
  })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiPropertyOptional({
    type: String,
    description: 'Profile picture URL',
  })
  @IsOptional()
  @IsString()
  profile_picture?: string;

  @ApiPropertyOptional({
    type: String,
    description: 'Phone number',
    example: '+1234567890',
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({
    type: String,
    description: 'Address',
    example: '123 Main St, City, Country',
  })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({
    type: Object,
    description: 'Notification preferences',
  })
  @IsOptional()
  @IsObject()
  notification_preferences?: Record<string, any>;
}
