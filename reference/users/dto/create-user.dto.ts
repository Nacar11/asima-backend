import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsEmail,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  Validate,
  Length,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { lowerCaseTransformer } from '@/utils/transformers/lower-case.transformer';
import { CostCenter } from '@/cost-centers/domain/cost-center';
import { CostCenterValidator } from '@/utils/validators/cost-centers.validator';
import { StatusEnum, UserSuffixEnum } from '@/users/users.enum';
import { GenderEnum } from '@/user-details/domain/user-detail';

export class CreateUserDto {
  @ApiProperty({ type: () => String, example: 'john.doe@cody.inc' })
  @Transform(lowerCaseTransformer)
  @IsNotEmpty()
  @IsEmail()
  email: string | null;

  @ApiProperty({ type: () => String, example: 'password', required: true })
  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  password: string;

  @ApiPropertyOptional({ type: () => String, example: 'password' })
  @IsOptional()
  @IsString()
  @MinLength(6)
  confirm_password?: string;

  @ApiPropertyOptional({ type: () => String, example: null })
  @IsOptional()
  @IsString()
  user_id?: string | null;

  @ApiProperty({ type: () => String, example: 'John' })
  @IsString()
  first_name: string | null;

  @ApiPropertyOptional({ type: () => String, example: null })
  @IsOptional()
  @IsString()
  middle_name?: string | null;

  @ApiProperty({ type: () => String, example: 'Doe' })
  @IsString()
  last_name: string | null;

  @ApiPropertyOptional({
    type: String,
    description: 'Suffix of the employee name (e.g., Jr., Sr.)',
    enum: UserSuffixEnum,
    example: UserSuffixEnum.JR,
  })
  @IsEnum(UserSuffixEnum, {
    message: 'suffix must be one of: Jr, Sr, II, III, IV, V, VI, or None',
  })
  @IsOptional()
  suffix?: UserSuffixEnum | string | null;

  @ApiPropertyOptional({
    type: String,
    required: false,
    description: 'Image in base 64 format.',
    example: `https://4.img-dpreview.com/files/p/E~TS590x0~articles/3925134721/0266554465.jpeg`,
  })
  @IsOptional()
  @IsString()
  image?: string | null;

  @ApiPropertyOptional({ type: Number, example: 1, nullable: true })
  @IsOptional()
  @IsInt()
  @Validate(CostCenterValidator)
  cost_center?: CostCenter | number | null;

  @ApiPropertyOptional({
    type: String,
    enum: StatusEnum,
    description: 'User status',
    example: StatusEnum.ACTIVE,
    default: StatusEnum.ACTIVE,
  })
  @IsOptional()
  @IsEnum(StatusEnum, {
    message: 'status must be a valid status from the enum',
  })
  status: StatusEnum;

  @ApiPropertyOptional({ type: Boolean, example: false, default: false })
  @IsOptional()
  @IsBoolean()
  system_admin?: boolean;

  @ApiPropertyOptional({ type: () => String, example: null })
  @IsOptional()
  @IsString()
  @Length(6, 6)
  device_pin?: string | null;

  @ApiPropertyOptional({
    type: String,
    description: 'Phone number',
    example: '+1234567890',
  })
  @IsOptional()
  @IsString()
  phone?: string | null;

  @ApiPropertyOptional({
    type: Boolean,
    description: 'Has the user verified their email?',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  email_verified?: boolean;

  @ApiPropertyOptional({
    type: Boolean,
    description: 'Has the user verified their phone?',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  phone_verified?: boolean;

  @ApiPropertyOptional({
    type: Boolean,
    description: 'Whether the user must change their password on first login',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  must_change_password?: boolean;

  @ApiPropertyOptional({
    type: Number,
    example: 1,
    description: 'Default address id for commerce actions',
  })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  default_address_id?: number | null;

  @ApiPropertyOptional({
    type: Number,
    example: 1,
    description: 'Preferred currency id for checkout/pricing',
  })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  preferred_currency_id?: number | null;

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
      'Profile picture. Send empty string or null to remove existing picture. ' +
      'For file upload, use multipart/form-data with "avatar" field.',
    example: '',
  })
  @IsOptional()
  @IsString()
  profile_picture?: string | null;
}
