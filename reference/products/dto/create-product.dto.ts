import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ListingTypeEnum } from '@/products/enums/listing-type.enum';

/**
 * DTO for creating a product
 *
 * Request body example:
 * ```json
 * {
 *   "product_name": "Premium Coffee Beans",
 *   "description": "Single-origin Arabica coffee beans from high-altitude farms",
 *   "status": "Active"
 * }
 * ```
 *
 * Note: seller_id is automatically set to the current user's ID.
 */
export class CreateProductDto {
  @ApiProperty({
    type: String,
    example: 'Premium Coffee Beans',
    description: 'Product name (minimum 3 characters, maximum 255 characters)',
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(3)
  @MaxLength(255)
  product_name: string;

  @ApiPropertyOptional({
    type: String,
    example: 'Single-origin Arabica coffee beans',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  description?: string | null;

  @ApiProperty({
    type: String,
    example: 'Published',
    default: 'Published',
    enum: ['Published', 'Draft', 'For Review'],
    description: 'Product status (Published/Draft/For Review)',
  })
  @IsOptional()
  @IsString()
  @IsIn(['Published', 'Draft', 'For Review'])
  status?: 'Published' | 'Draft' | 'For Review';

  @ApiPropertyOptional({
    type: String,
    example: 'product',
    enum: ListingTypeEnum,
    description:
      'Listing type (product for marketplace items, material for internal materials). Defaults to product if not provided.',
  })
  @IsOptional()
  @IsString()
  @IsIn(Object.values(ListingTypeEnum))
  listing_type?: ListingTypeEnum;
}
