import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
} from 'class-validator';

/**
 * DTO for updating a bank
 */
export class UpdateBankDto {
  @ApiPropertyOptional({
    type: String,
    example: 'BPI',
    description: 'Unique bank code identifier',
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(20)
  bank_code?: string;

  @ApiPropertyOptional({
    type: String,
    example: 'Bank of the Philippine Islands',
    description: 'Full bank name',
  })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  bank_name?: string;

  @ApiPropertyOptional({
    type: String,
    example: 'https://example.com/logos/bpi.png',
    nullable: true,
    description: 'URL to bank logo image',
  })
  @IsOptional()
  @IsString()
  @IsUrl()
  @MaxLength(500)
  logo_url?: string | null;

  @ApiPropertyOptional({
    type: Boolean,
    example: true,
    description: 'Whether the bank is active',
  })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @ApiPropertyOptional({
    type: Number,
    example: 1,
    description: 'Display order for sorting',
  })
  @IsOptional()
  @IsInt()
  display_order?: number;
}
