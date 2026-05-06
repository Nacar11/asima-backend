import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO for unified checkout preview request.
 */
export class UnifiedCheckoutPreviewDto {
  @ApiPropertyOptional({
    type: Number,
    description: 'Delivery address ID for products',
  })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  delivery_address_id?: number;

  @ApiPropertyOptional({
    type: Number,
    description: 'Default service address ID for services',
  })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  service_address_id?: number;

  @ApiPropertyOptional({
    type: Number,
    description: 'Shipping method ID for products',
  })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  shipping_method_id?: number;
}
