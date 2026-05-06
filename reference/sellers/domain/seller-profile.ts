import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Public provider profile domain model
 * Represents the public-facing profile of a service provider
 */
export class SellerProfile {
  @ApiProperty({
    type: Number,
    example: 1,
    description: 'Seller ID',
  })
  id: number;

  @ApiProperty({
    type: String,
    example: 'Tech Store',
    description: 'Store/Business name',
  })
  name: string;

  @ApiProperty({
    type: String,
    example: 'tech-store',
    description: 'URL-friendly slug',
  })
  slug: string;

  @ApiPropertyOptional({
    type: String,
    example: 'https://example.com/avatar.png',
    description: 'Store logo/avatar URL',
    nullable: true,
  })
  avatar?: string | null;

  @ApiPropertyOptional({
    type: String,
    example: 'https://example.com/cover.png',
    description: 'Store banner/cover image URL',
    nullable: true,
  })
  cover_image?: string | null;

  @ApiPropertyOptional({
    type: String,
    example:
      'Professional home repair and maintenance services with 10+ years of experience.',
    description: 'Provider bio/about section',
    nullable: true,
  })
  bio?: string | null;

  @ApiPropertyOptional({
    type: Number,
    example: 10,
    description: 'Years of experience',
    nullable: true,
  })
  years_of_experience?: number | null;

  @ApiProperty({
    type: Number,
    example: 4.8,
    description: 'Average rating (1-5)',
  })
  average_rating: number;

  @ApiProperty({
    type: Number,
    example: 25,
    description: 'Total number of reviews',
  })
  total_reviews: number;

  @ApiProperty({
    type: Number,
    example: 12,
    description: 'Total number of services offered',
  })
  total_services: number;

  @ApiProperty({
    type: Number,
    example: 150,
    description: 'Total completed bookings',
  })
  total_completed_bookings: number;

  @ApiProperty({
    type: Boolean,
    example: true,
    description: 'Whether the seller is verified',
  })
  is_verified: boolean;

  @ApiProperty({
    type: Boolean,
    example: true,
    description: 'Whether the seller offers services',
  })
  sells_services: boolean;

  @ApiProperty({
    type: Boolean,
    example: true,
    description: 'Whether the seller offers products',
  })
  sells_products: boolean;

  @ApiPropertyOptional({
    type: Number,
    example: 25.5,
    description: 'Hourly rate for services',
  })
  hourly_rate?: number;

  @ApiPropertyOptional({
    type: String,
    example: 'sole_proprietor',
    description: 'Business type',
    nullable: true,
  })
  business_type?: string | null;

  @ApiProperty({
    description: 'Date when the seller account was created',
  })
  member_since: Date;
}

/**
 * Portfolio item domain model
 * Represents a portfolio work sample
 */
export class PortfolioItem {
  @ApiProperty({
    type: Number,
    example: 1,
  })
  id: number;

  @ApiProperty({
    type: String,
    example: 'https://example.com/portfolio1.jpg',
  })
  image_url: string;

  @ApiPropertyOptional({
    type: String,
    example: 'Kitchen Renovation Project',
    nullable: true,
  })
  title?: string | null;

  @ApiPropertyOptional({
    type: String,
    example: 'Complete kitchen remodel including cabinets and countertops',
    nullable: true,
  })
  description?: string | null;

  @ApiProperty({
    type: Number,
    example: 0,
    description: 'Display order',
  })
  display_order: number;
}

/**
 * Certification domain model
 */
export class Certification {
  @ApiProperty({
    type: Number,
    example: 1,
  })
  id: number;

  @ApiProperty({
    type: String,
    example: 'Licensed Electrician',
  })
  name: string;

  @ApiPropertyOptional({
    type: String,
    example: 'National Electrical Contractors Association',
    nullable: true,
  })
  issuer?: string | null;

  @ApiPropertyOptional({
    type: String,
    example: 'https://example.com/cert.jpg',
    nullable: true,
  })
  image_url?: string | null;

  @ApiPropertyOptional({
    description: 'Date when certification was issued',
    nullable: true,
  })
  issued_at?: Date | null;

  @ApiPropertyOptional({
    description: 'Date when certification expires',
    nullable: true,
  })
  expires_at?: Date | null;
}
