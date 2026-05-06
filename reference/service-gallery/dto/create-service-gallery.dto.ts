import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  IsUrl,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateServiceGalleryDto {
  @ApiProperty({ type: Number, example: 1 })
  @Type(() => Number)
  @IsInt()
  service_id: number;

  @ApiProperty({ type: String, example: 'https://example.com/image.jpg' })
  @IsNotEmpty()
  @IsString()
  @IsUrl({ require_tld: false })
  @MaxLength(500)
  image_url: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  caption?: string | null;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  alt_text?: string | null;

  @ApiPropertyOptional({ type: Boolean, default: false })
  @IsOptional()
  @IsBoolean()
  is_primary?: boolean;

  @ApiPropertyOptional({ type: Number, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  display_order?: number;

  @ApiPropertyOptional({ type: String, default: 'Active' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  status?: string;
}
