import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEmail,
  IsOptional,
  IsEnum,
  MaxLength,
  IsNotEmpty,
} from 'class-validator';
import { FranchiseStatusEnum } from '@/franchises/domain/franchise-status.enum';

export class CreateFranchiseDto {
  @ApiProperty({ example: 'ABC Franchise' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  owner_name: string;

  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  @IsNotEmpty()
  @MaxLength(255)
  email: string;

  @ApiProperty({ example: '+639123456789' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  phone: string;

  @ApiProperty({ example: '123 Main Street' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  address_line1: string;

  @ApiPropertyOptional({ example: 'Suite 100' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  address_line2?: string;

  @ApiProperty({ example: 'Manila' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  city: string;

  @ApiProperty({ example: 'Metro Manila' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  state_province: string;

  @ApiProperty({ example: '1000' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  postal_code: string;

  @ApiPropertyOptional({ example: 'Philippines', default: 'Philippines' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  country?: string;

  @ApiPropertyOptional({
    enum: FranchiseStatusEnum,
    default: FranchiseStatusEnum.SCREENING,
  })
  @IsOptional()
  @IsEnum(FranchiseStatusEnum)
  status?: FranchiseStatusEnum;

  @ApiPropertyOptional({ example: 'Additional notes about the franchise' })
  @IsOptional()
  @IsString()
  notes?: string;
}
