import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEmail,
  IsOptional,
  IsEnum,
  MaxLength,
} from 'class-validator';
import { FranchiseStatusEnum } from '@/franchises/domain/franchise-status.enum';

export class UpdateFranchiseDto {
  @ApiPropertyOptional({ example: 'ABC Franchise' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({ example: 'John Doe' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  owner_name?: string;

  @ApiPropertyOptional({ example: 'john@example.com' })
  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string;

  @ApiPropertyOptional({ example: '+639123456789' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  phone?: string;

  @ApiPropertyOptional({ example: '123 Main Street' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  address_line1?: string;

  @ApiPropertyOptional({ example: 'Suite 100' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  address_line2?: string;

  @ApiPropertyOptional({ example: 'Manila' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @ApiPropertyOptional({ example: 'Metro Manila' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  state_province?: string;

  @ApiPropertyOptional({ example: '1000' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  postal_code?: string;

  @ApiPropertyOptional({ example: 'Philippines' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  country?: string;

  @ApiPropertyOptional({ enum: FranchiseStatusEnum })
  @IsOptional()
  @IsEnum(FranchiseStatusEnum)
  status?: FranchiseStatusEnum;

  @ApiPropertyOptional({ example: 'Additional notes about the franchise' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({
    example: 'Reason for status change',
    description: 'Description for status change audit trail',
  })
  @IsOptional()
  @IsString()
  status_change_description?: string;
}
