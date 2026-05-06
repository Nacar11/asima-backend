import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MinLength,
  Validate,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { lowerCaseTransformer } from '@/utils/transformers/lower-case.transformer';
import { CostCenter } from '@/cost-centers/domain/cost-center';
import { CostCenterValidator } from '@/utils/validators/cost-centers.validator';
import { StatusEnum, UserSuffixEnum } from '@/users/users.enum';
import { GenderEnum } from '@/user-details/domain/user-detail';

export class UpdateUserDto {
  @ApiPropertyOptional({ type: () => String, example: 'john.doe@cody.inc' })
  @Transform(lowerCaseTransformer)
  @IsOptional()
  @IsEmail()
  email?: string | null;

  @ApiPropertyOptional({ type: () => String, example: 'password' })
  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

  @ApiPropertyOptional({ type: () => String, example: 'password' })
  @IsOptional()
  @IsString()
  @MinLength(6)
  confirm_password?: string;

  @ApiPropertyOptional({ type: () => String, example: null })
  @IsOptional()
  @IsString()
  user_id?: string | null;

  @ApiPropertyOptional({ type: () => String, example: 'John' })
  @IsOptional()
  @IsString()
  first_name?: string | null;

  @ApiPropertyOptional({ type: () => String, example: null })
  @IsOptional()
  @IsString()
  middle_name?: string | null;

  @ApiPropertyOptional({ type: () => String, example: 'Doe' })
  @IsOptional()
  @IsString()
  last_name?: string | null;

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
  })
  @IsOptional()
  @IsEnum(StatusEnum, {
    message: 'status must be a valid status from the enum',
  })
  status?: StatusEnum;

  @ApiPropertyOptional({ type: Boolean, example: false })
  @IsOptional()
  @IsBoolean()
  system_admin?: boolean;

  @ApiPropertyOptional({ type: () => String, example: null })
  @IsOptional()
  @IsString()
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
    description: 'Whether the user must change their password on first login',
  })
  @IsOptional()
  @IsBoolean()
  must_change_password?: boolean;

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
      'Profile picture. Accepts raw base64 string (e.g., "iVBORw0...") or data URI format (e.g., "data:image/png;base64,iVBORw0..."). Send empty string/null to remove existing picture.',
    example:
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  })
  @IsOptional()
  @IsString()
  profile_picture?: string | null;

  // This field is handled by FileInterceptor, but needs to be here
  // to pass validation when multipart/form-data sends empty avatar field
  @IsOptional()
  avatar?: any;
}
