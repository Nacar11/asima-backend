import { Exclude } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { User } from '@/users/domain/user';
import { Seller } from '@/sellers/domain/seller';
import { ProductAttribute } from '@/product-attributes/domain/product-attribute';
import { ProductVariant } from '@/product-variants/domain/product-variant';
import { ProductSpecification } from '@/product-specifications/domain/product-specification';
import { Media } from '@/media/domain/media';
import { ProductMediaMapping } from '@/media/domain/product-media-mapping';
import { ProductFeaturedSection } from '@/featured-products/domain/product-featured-section';
import { ListingTypeEnum } from '@/products/enums/listing-type.enum';

/**
 * Product domain entity
 */
export class Product {
  @ApiProperty({
    type: Number,
    example: 1,
  })
  id: number;

  @ApiProperty({
    type: String,
    example: 'Premium Coffee Beans',
  })
  product_name: string;

  @ApiPropertyOptional({
    type: String,
    example: 'Single-origin Arabica coffee beans',
    nullable: true,
  })
  description?: string | null;

  @ApiProperty({
    type: String,
    example: 'Published',
    enum: ['Published', 'Draft', 'For Review'],
    description: 'Product status (Published/Draft/For Review)',
  })
  status: 'Published' | 'Draft' | 'For Review';

  @ApiProperty({
    type: String,
    example: 'product',
    enum: ListingTypeEnum,
    description:
      'Listing type (product for marketplace items, material for internal materials)',
  })
  listing_type: ListingTypeEnum;

  @ApiProperty({
    type: Number,
    example: 1,
    description: 'Seller ID owning this product',
  })
  seller_id: number;

  @ApiPropertyOptional({
    type: Number,
    nullable: true,
    example: 4.5,
    description: 'Average rating based on active reviews (1-5)',
  })
  average_rating?: number | null;

  @ApiPropertyOptional({
    type: Number,
    example: 10,
    description: 'Total number of active reviews for this product',
  })
  total_reviews?: number;

  @ApiPropertyOptional({
    type: Number,
    nullable: true,
    example: 149.0,
    description:
      'Lowest selling_price among all product_variants. Used as the display price on listing views.',
  })
  lowest_price?: number | null;

  @ApiPropertyOptional({
    type: Object,
    nullable: true,
    example: {
      id: 1,
      first_name: 'Tech Store',
      last_name: 'Electronics and gadgets store',
    },
  })
  seller?: Pick<Seller, 'id' | 'store_name' | 'store_description' | 'status'> | null;

  @ApiPropertyOptional({
    type: Array,
    nullable: true,
    example: [
      {
        id: 1,
        category_name: 'Electronics',
        is_primary: true,
        display_order: 1,
      },
      {
        id: 2,
        category_name: 'Smartphones',
        is_primary: false,
        display_order: 2,
      },
    ],
  })
  categories?: Array<{
    id: number;
    category_name: string;
    is_primary: boolean;
    display_order: number;
  }> | null;

  @ApiPropertyOptional({
    type: Array,
    nullable: true,
    example: [
      {
        id: 1,
        product_id: 1,
        attribute_id: 1,
        attribute_value_ids: [1, 2, 3],
        attribute: {
          id: 1,
          attribute_name: 'Size',
          description: 'Product size options',
        },
      },
    ],
  })
  product_attributes?: ProductAttribute[] | null;

  @ApiPropertyOptional({
    type: Array,
    nullable: true,
    example: [
      {
        id: 1,
        product_id: 1,
        sku: 'COFFEE-001',
        variant_name: '200g Whole Beans',
        selling_price: 720.0,
        status: 'Active',
        attribute_values: [
          {
            id: 1,
            attribute_value_id: 1,
            product_attribute_id: 1,
            attribute_id: 1,
            attribute_name: 'Size',
            value: '200g',
          },
        ],
        inventory_stock: {
          id: 1,
          variant_id: 1,
          stock_quantity: 50,
          available_quantity: 50,
        },
      },
    ],
  })
  product_variants?: ProductVariant[] | null;

  @ApiPropertyOptional({
    type: Array,
    nullable: true,
    example: [
      {
        id: 1,
        product_id: 1,
        specification_name: 'Display Size',
        unit: 'inches',
        specification_value: '6.7',
        sort_order: 1,
      },
      {
        id: 2,
        product_id: 1,
        specification_name: 'Weight',
        unit: 'grams',
        specification_value: '221',
        sort_order: 2,
      },
    ],
  })
  product_specifications?: ProductSpecification[] | null;

  @ApiPropertyOptional({
    type: Array,
    nullable: true,
    example: [
      {
        id: 1,
        name: 'organic',
        slug: 'organic',
        tag_order: 0,
      },
      {
        id: 2,
        name: 'bestseller',
        slug: 'bestseller',
        tag_order: 1,
      },
    ],
  })
  tags?: Array<{
    id: number;
    name: string;
    slug: string;
    tag_order: number;
  }> | null;

  @ApiPropertyOptional({
    type: () => [ProductMediaMapping],
    nullable: true,
    description: 'Mappings between this product and its media resources',
  })
  product_media_mappings?: ProductMediaMapping[] | null;

  @ApiPropertyOptional({
    type: () => Media,
    nullable: true,
    description:
      'Primary product image. Returns the image marked as primary, or the first image by display_order if no primary is set.',
    example: {
      id: 1,
      media_type: 'image',
      file_name: 'product-image.jpg',
      file_path: '/uploads/products/product-image.jpg',
      url: 'https://cdn.example.com/uploads/products/product-image.jpg',
    },
  })
  primary_image?: Media | null;

  // Featured sections - a product can be in multiple sections
  @ApiPropertyOptional({
    type: () => [ProductFeaturedSection],
    nullable: true,
    description: 'Sections where this product is featured',
    example: [
      {
        section: 'featured',
        display_order: 1,
        featured_at: '2025-12-09T10:30:00Z',
        featured_by: { id: 1, first_name: 'Admin', last_name: 'User' },
      },
      {
        section: 'bestsellers',
        display_order: 3,
        featured_at: '2025-12-08T15:00:00Z',
        featured_by: { id: 1, first_name: 'Admin', last_name: 'User' },
      },
    ],
  })
  featured_sections?: ProductFeaturedSection[] | null;

  @ApiPropertyOptional({
    type: () => User,
    nullable: true,
    example: { id: 1, first_name: 'Admin', last_name: 'User' },
  })
  created_by?: Pick<User, 'id' | 'first_name' | 'last_name'> | null;

  @ApiProperty()
  created_at: Date;

  @ApiPropertyOptional({
    type: () => User,
    nullable: true,
    example: { id: 1, first_name: 'Admin', last_name: 'User' },
  })
  updated_by?: Pick<User, 'id' | 'first_name' | 'last_name'> | null;

  @ApiProperty()
  updated_at: Date;

  @ApiPropertyOptional({
    type: () => User,
    nullable: true,
    example: null,
  })
  deleted_by?: Pick<User, 'id' | 'first_name' | 'last_name'> | null;

  @ApiPropertyOptional({
    example: null,
    nullable: true,
  })
  deleted_at?: Date | null;

  @Exclude()
  __entity?: string;
}
