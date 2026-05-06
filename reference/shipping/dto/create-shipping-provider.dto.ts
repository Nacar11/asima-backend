import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsBoolean,
  IsOptional,
  MaxLength,
  IsInt,
  Min,
} from 'class-validator';
import { ProviderType } from '@/shipping/domain/enums/shipping.enum';

/**
 * DTO for creating a new shipping provider
 */
export class CreateShippingProviderDto {
  @ApiProperty({
    type: String,
    example: 'In-House Delivery',
    description: 'Name of the shipping provider',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiProperty({
    type: String,
    example: 'in_house',
    description: 'Unique code for the provider',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  code: string;

  @ApiPropertyOptional({
    type: String,
    example: 'Company-operated delivery service',
    description: 'Description of the provider',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    enum: ProviderType,
    example: ProviderType.IN_HOUSE,
    description: 'Type of shipping provider',
  })
  @IsEnum(ProviderType)
  provider_type: ProviderType;

  @ApiPropertyOptional({
    type: Boolean,
    example: true,
    description: 'Whether the provider is active',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  is_active?: boolean;

  @ApiPropertyOptional({
    type: Boolean,
    example: false,
    description: 'Whether this is the default provider',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  is_default?: boolean;

  @ApiPropertyOptional({
    type: Number,
    example: 0,
    description: 'Display order for sorting',
    default: 0,
  })
  @IsInt()
  @Min(0)
  @IsOptional()
  display_order?: number;
}
