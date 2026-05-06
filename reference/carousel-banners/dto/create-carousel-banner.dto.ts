import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateCarouselBannerDto {
  @ApiProperty({ type: Number, example: 1 })
  @IsNotEmpty()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return value;
    return parseInt(value, 10);
  })
  @IsInt()
  @Min(1)
  media_id: number;

  @ApiProperty({ type: String, example: 'Carousel Banner 1', maxLength: 255 })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  headline: string;

  @ApiPropertyOptional({
    type: String,
    example: 'Subtext',
    maxLength: 255,
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

  @ApiPropertyOptional({
    type: Number,
    example: 0,
    description: 'Lower numbers show first',
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    return parseInt(value, 10);
  })
  @IsInt()
  display_order?: number;

  @ApiPropertyOptional({ type: Boolean, example: true })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    if (typeof value === 'boolean') return value;
    return value === 'true' || value === '1';
  })
  @IsBoolean()
  is_active?: boolean;

  @ApiPropertyOptional({ type: () => Date, nullable: true })
  @IsOptional()
  @IsDateString()
  start_at?: Date | null;

  @ApiPropertyOptional({ type: () => Date, nullable: true })
  @IsOptional()
  @IsDateString()
  end_at?: Date | null;
}
