import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
} from 'class-validator';

/**
 * DTO for creating a bank
 */
export class CreateBankDto {
  @ApiProperty({
    type: String,
    example: 'BPI',
    description: 'Unique bank code identifier',
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(2)
  @MaxLength(20)
  bank_code: string;

  @ApiProperty({
    type: String,
    example: 'Bank of the Philippine Islands',
    description: 'Full bank name',
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  bank_name: string;

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
    description: 'Whether the bank is active (default: true)',
  })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @ApiPropertyOptional({
    type: Number,
    example: 1,
    description: 'Display order for sorting (default: 0)',
  })
  @IsOptional()
  @IsInt()
  display_order?: number;
}
