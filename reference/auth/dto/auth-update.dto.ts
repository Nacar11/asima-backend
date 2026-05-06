import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { lowerCaseTransformer } from '@/utils/transformers/lower-case.transformer';
import { GenderEnum } from '@/user-details/domain/user-detail';

export class AuthUpdateDto {
  @ApiPropertyOptional({ example: 'John' })
  @IsOptional()
  @IsNotEmpty({ message: 'mustBeNotEmpty' })
  first_name?: string;

  @ApiPropertyOptional({ example: 'Doe' })
  @IsOptional()
  @IsNotEmpty({ message: 'mustBeNotEmpty' })
  last_name?: string;

  @ApiPropertyOptional({ example: 'new.email@example.com' })
  @IsOptional()
  @IsNotEmpty()
  @IsEmail()
  @Transform(lowerCaseTransformer)
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNotEmpty()
  @MinLength(6)
  password?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNotEmpty({ message: 'mustBeNotEmpty' })
  oldPassword?: string;

  @ApiPropertyOptional({
    type: String,
    description: 'Phone number',
    example: '+1234567890',
  })
  @IsOptional()
  @IsString()
  phone?: string | null;

  @ApiPropertyOptional({
    type: String,
    description: 'Address',
    example: '123 Main St, City, Country',
  })
  @IsOptional()
  @IsString()
  address?: string | null;

  @ApiPropertyOptional({
    enum: GenderEnum,
    description: 'Gender',
    example: GenderEnum.MALE,
  })
  @IsOptional()
  @IsEnum(GenderEnum)
  gender?: GenderEnum;

  @ApiPropertyOptional({
    type: String,
    description: 'Date of birth (YYYY-MM-DD)',
    example: '1990-01-15',
  })
  @IsOptional()
  @IsDateString()
  date_of_birth?: string;

  @ApiPropertyOptional({
    type: String,
    description:
      'Profile picture. Accepts raw base64 string or data URI format (e.g., "data:image/png;base64,iVBORw0..."). Send empty string/null to remove existing picture.',
    example: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAY...',
  })
  @IsOptional()
  @IsString()
  profile_picture?: string | null;
}
