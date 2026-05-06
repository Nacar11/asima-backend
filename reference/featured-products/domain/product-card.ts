import { Exclude } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Media } from '@/media/domain/media';
import { Seller } from '@/sellers/domain/seller';

/**
 * Product card view model used by recommendations and featured products modules
 */
export class ProductCard {
  @ApiProperty({ type: Number, example: 2 })
  id: number;

  @ApiProperty({ type: String, example: 'Organic Green Tea' })
  product_name: string;

  @ApiPropertyOptional({
    type: String,
    nullable: true,
    example: 'Premium loose leaf green tea',
  })
  description?: string | null;

  @ApiPropertyOptional({
    type: () => Media,
    nullable: true,
    description:
      'Primary product image. Returns the image marked as primary, or the first image by display_order if no primary is set.',
  })
  primary_image?: Media | null;

  @ApiProperty({ type: Number, example: 280.0 })
  min_price: number;

  @ApiProperty({ type: Number, example: 450.0 })
  max_price: number;

  @ApiPropertyOptional({
    type: Number,
    nullable: true,
    example: 4.7,
    description: 'Average rating across reviews (1-5 scale)',
  })
  average_rating?: number | null;

  @ApiPropertyOptional({
    type: Number,
    nullable: true,
    example: 89,
    description: 'Total number of reviews for this product',
  })
  total_reviews?: number | null;

  @ApiPropertyOptional({
    type: () => Seller,
    nullable: true,
    description: 'Summary seller information for this product',
    example: {
      id: 1,
      store_name: 'Tea House',
      store_logo_url: 'https://cdn.example.com/stores/tea-logo.jpg',
    },
  })
  seller?: Pick<Seller, 'id' | 'store_name' | 'store_logo_url'> | null;

  @ApiPropertyOptional({
    type: Number,
    example: 85,
    description:
      'Computed relevance score from 0-100 based on recommendation or featured logic. Optional for modules that do not compute relevance.',
  })
  relevance_score?: number | null;

  @Exclude()
  __entity?: string;
}
