import { Exclude } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ReviewMediaMapping } from '@/media/domain/review-media-mapping';
import { Causer } from '@/utils/domain/causer';
import { User } from '@/users/domain/user';
import { ReviewableTypeEnum } from '@/reviews/enums/reviewable-type.enum';
import { ReviewSourceTypeEnum } from '@/reviews/enums/review-source-type.enum';

export class Review {
  @ApiProperty({ type: Number, example: 1 })
  id: number;

  @ApiProperty({ type: Number, example: 1 })
  user_id: number;

  @ApiPropertyOptional({ type: () => User, nullable: true })
  user?: User | null;

  @ApiProperty({ type: Number, example: 1 })
  seller_id: number;

  @ApiPropertyOptional({ type: Number, example: 1 })
  product_id?: number;

  @ApiPropertyOptional({ type: String, example: 'DPO Powder Products' })
  product_name?: string;

  @ApiPropertyOptional({ type: Number, example: 1 })
  sales_order_item_id?: number;

  @ApiPropertyOptional({ type: String, example: 'Powder Caramel' })
  variant_name?: string;

  @ApiProperty({
    enum: ReviewableTypeEnum,
    example: ReviewableTypeEnum.PRODUCT,
  })
  reviewable_type: ReviewableTypeEnum;

  @ApiPropertyOptional({
    enum: ReviewSourceTypeEnum,
    example: ReviewSourceTypeEnum.SALES_ORDER,
  })
  source_type?: ReviewSourceTypeEnum;

  @ApiPropertyOptional({ type: Number, example: 1 })
  source_id?: number;

  @ApiPropertyOptional({ type: Number, example: 1 })
  service_id?: number;

  @ApiPropertyOptional({ type: Number, example: 1 })
  booking_id?: number;

  @ApiPropertyOptional({
    type: 'object',
    example: {
      punctuality: 5,
      quality: 5,
      communication: 4,
      professionalism: 5,
    },
  })
  aspect_ratings?: {
    punctuality?: number;
    quality?: number;
    communication?: number;
    professionalism?: number;
  };

  @ApiProperty({ type: Number, example: 5, minimum: 1, maximum: 5 })
  rating: number;

  @ApiPropertyOptional({
    type: String,
    example: 'Excellent product! Highly recommended.',
  })
  comment?: string;

  @ApiProperty({ type: Boolean, example: false })
  is_anonymous: boolean;

  @ApiProperty({ type: Boolean, example: true })
  is_verified_purchase: boolean;

  @ApiProperty({ enum: ['Active', 'Removed'], example: 'Active' })
  status: 'Active' | 'Removed';

  @ApiPropertyOptional({
    type: String,
    example: 'Thank you for your feedback!',
  })
  reply_text?: string;

  @ApiPropertyOptional({ type: String, example: '2024-01-02T10:00:00Z' })
  reply_at?: string;

  @ApiPropertyOptional({
    type: Object,
    nullable: true,
    example: { id: 1, first_name: 'Admin', last_name: 'User' },
  })
  created_by?: Causer | null;

  @ApiPropertyOptional({
    type: Object,
    nullable: true,
    example: { id: 1, first_name: 'Admin', last_name: 'User' },
  })
  updated_by?: Causer | null;

  @ApiPropertyOptional({
    type: Object,
    nullable: true,
    example: null,
  })
  deleted_by?: Causer | null;

  @ApiProperty({ type: String, example: '2024-01-01T10:00:00Z' })
  created_at: string;

  @ApiProperty({ type: String, example: '2024-01-01T10:00:00Z' })
  updated_at: string;

  @ApiPropertyOptional({ type: String, example: null })
  deleted_at?: string;

  @ApiPropertyOptional({
    type: () => [ReviewMediaMapping],
    nullable: true,
    description: 'Media mappings attached to this review',
  })
  review_media_mappings?: ReviewMediaMapping[] | null;

  @Exclude()
  __entity?: string;
}
