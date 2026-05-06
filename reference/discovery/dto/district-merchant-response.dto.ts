import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DistrictMerchantResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  store_name: string;

  @ApiProperty()
  slug: string;

  @ApiPropertyOptional({ nullable: true })
  store_logo_url: string | null;

  @ApiProperty()
  is_verified: boolean;

  @ApiProperty()
  average_rating: number;

  @ApiProperty()
  total_reviews: number;
}
