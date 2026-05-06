import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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

export class AuthRegisterLoginDto {
  @ApiProperty({ example: 'john.doe@cody.inc', type: String })
  @Transform(lowerCaseTransformer)
  @IsEmail()
  email: string;

  @ApiProperty()
  @MinLength(6)
  password: string;

  @ApiProperty()
  @MinLength(6)
  confirm_password: string;

  @ApiProperty({ example: 'John' })
  @IsNotEmpty()
  first_name: string;

  @ApiProperty({ example: 'Doe' })
  @IsNotEmpty()
  last_name: string;

  @ApiPropertyOptional({ type: String, example: null })
  @IsOptional()
  @IsString()
  user_id?: string | null;

  @ApiPropertyOptional({ type: String, example: '+1234567890' })
  @IsOptional()
  @IsString()
  phone?: string | null;

  @ApiPropertyOptional({ type: String, example: '123 Main St, City, Country' })
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
    nullable: true,
    description: 'Optional referral code entered during registration',
    example: 'FREECOFFEE',
  })
  @IsOptional()
  @IsString()
  referral_code?: string | null;
}
