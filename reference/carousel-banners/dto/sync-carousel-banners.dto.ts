import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

class SyncCarouselBannerItemDto {
  @ApiProperty({ type: Number, example: 1 })
  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  media_id: number;

  @ApiProperty({ type: String, example: 'Carousel Banner 1', maxLength: 255 })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  headline: string;

  @ApiProperty({
    type: String,
    example: 'Subtext',
    maxLength: 255,
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  subtext?: string | null;

  @ApiProperty({ type: String, example: 'Shop Now', maxLength: 50 })
  @IsNotEmpty()
  @IsString()
  @MaxLength(50)
  cta_text: string;

  @ApiProperty({ type: String, example: '/products', maxLength: 500 })
  @IsNotEmpty()
  @IsString()
  @MaxLength(500)
  cta_link: string;

  @ApiProperty({
    type: Number,
    example: 0,
    description: 'Lower numbers show first',
  })
  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  display_order: number;

  @ApiProperty({ type: Boolean, example: true })
  @IsNotEmpty()
  @IsBoolean()
  is_active: boolean;

  @ApiPropertyOptional({
    type: () => Date,
    nullable: true,
    example: '2025-12-16T09:26:02.871Z',
  })
  @IsOptional()
  @IsDateString()
  start_at?: Date | null;

  @ApiPropertyOptional({
    type: () => Date,
    nullable: true,
    example: '2026-12-16T09:26:02.871Z',
  })
  @IsOptional()
  @IsDateString()
  end_at?: Date | null;
}

export class SyncCarouselBannersDto {
  @ApiProperty({
    type: [SyncCarouselBannerItemDto],
    description: 'Full list of carousel banners to keep (replaces existing)',
  })
  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SyncCarouselBannerItemDto)
  banners: SyncCarouselBannerItemDto[];
}
