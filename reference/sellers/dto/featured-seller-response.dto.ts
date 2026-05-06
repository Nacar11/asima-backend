import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class FeaturedProductDto {
  @ApiProperty({ type: Number })
  id: number;

  @ApiProperty({ type: String })
  product_name: string;
}

export class FeaturedServiceDto {
  @ApiProperty({ type: Number })
  id: number;

  @ApiProperty({ type: String })
  title: string;
}

export class FeaturedSellerResponseDto {
  @ApiProperty({ type: Number })
  id: number;

  @ApiProperty({ type: String })
  store_name: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  store_logo_url?: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  store_description?: string | null;

  @ApiProperty({ type: Boolean })
  sells_products: boolean;

  @ApiProperty({ type: Boolean })
  sells_services: boolean;

  @ApiPropertyOptional({ type: String, nullable: true })
  pickup_address?: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  pickup_city?: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  pickup_province?: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  pickup_postal_code?: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  contact?: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  email?: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  website?: string | null;

  @ApiPropertyOptional({ type: Number, description: 'Total published products' })
  product_count?: number;

  @ApiPropertyOptional({ type: Number, description: 'Total active services' })
  service_count?: number;

  @ApiPropertyOptional({
    type: () => [FeaturedProductDto],
    nullable: true,
    description:
      'First 5 published products (present when sells_products=true)',
  })
  products?: FeaturedProductDto[] | null;

  @ApiPropertyOptional({
    type: () => [FeaturedServiceDto],
    nullable: true,
    description: 'First 5 active services (present when sells_services=true)',
  })
  services?: FeaturedServiceDto[] | null;
}
