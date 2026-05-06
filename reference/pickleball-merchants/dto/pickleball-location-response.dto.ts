import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PickleballLocationResponseDto {
  @ApiProperty()
  key: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional({ nullable: true })
  subtitle?: string | null;

  @ApiPropertyOptional({ nullable: true })
  store_name?: string | null;

  @ApiPropertyOptional({ nullable: true })
  seller_id?: number | null;

  @ApiPropertyOptional({ nullable: true })
  image_url?: string | null;

  @ApiPropertyOptional({ nullable: true })
  background_image_url?: string | null;

  @ApiProperty()
  status: string;

  @ApiProperty()
  display_order: number;

  @ApiProperty()
  is_locked: boolean;

  @ApiProperty()
  is_official: boolean;

  @ApiProperty()
  source_type: string;

  @ApiPropertyOptional({ nullable: true })
  city?: string | null;

  @ApiPropertyOptional({ nullable: true })
  province?: string | null;
}
