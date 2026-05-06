import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ListingTypeEnum } from '@/products/enums/listing-type.enum';

/**
 * DTO for updating a product
 */
export class UpdateProductDto {
  @ApiPropertyOptional({
    type: String,
    example: 'Updated Coffee Beans',
  })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(255)
  product_name?: string;

  @ApiPropertyOptional({
    type: String,
    example: 'Updated description',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  description?: string | null;

  @ApiPropertyOptional({
    type: String,
    example: 'Published',
    enum: ['Published', 'Draft', 'For Review'],
    description: 'Product status (Published/Draft/For Review)',
  })
  @IsOptional()
  @IsString()
  @IsIn(['Published', 'Draft', 'For Review'])
  status?: 'Published' | 'Draft' | 'For Review';

  @ApiPropertyOptional({
    type: String,
    example: 'material',
    enum: ListingTypeEnum,
    description:
      'Listing type (product for marketplace items, material for internal materials)',
  })
  @IsOptional()
  @IsString()
  @IsIn(Object.values(ListingTypeEnum))
  listing_type?: ListingTypeEnum;
}
