import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

/**
 * Admin-only create payload.
 *
 * Carries the WIDE field set (`role_id`, `is_active`, optional
 * `system_admin`). The self-service surface has no equivalent — by design,
 * an employee cannot create a user.
 */
export class CreateUserDto {
  @ApiProperty({ example: 'jane.smith@asima.inc' })
  @IsEmail()
  @MaxLength(255)
  email: string;

  @ApiProperty({ example: 'P@ssw0rd!', minLength: 8 })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password: string;

  @ApiProperty({ example: 'Jane' })
  @IsString()
  @MaxLength(100)
  first_name: string;

  @ApiProperty({ example: 'Smith' })
  @IsString()
  @MaxLength(100)
  last_name: string;

  @ApiPropertyOptional({ example: 'Senior HR Administrator' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  title?: string | null;

  @ApiProperty({ example: 2 })
  @IsInt()
  role_id: number;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
