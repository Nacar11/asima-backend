import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';

export class UpdateEdistrictDto {
  @ApiPropertyOptional({ example: 'minglanilla-tungkop' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'key must be lowercase kebab-case (e.g. "my-district")',
  })
  key?: string;

  @ApiPropertyOptional({ example: 'Minglanilla Tungkop' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @ApiPropertyOptional({ example: 'Browse services in Minglanilla' })
  @IsOptional()
  @ValidateIf((o) => o.subtitle !== null)
  @IsString()
  @MaxLength(120)
  subtitle?: string | null;

  @ApiPropertyOptional({ example: 'Tungkop Sports Hub' })
  @IsOptional()
  @ValidateIf((o) => o.store_name !== null)
  @IsString()
  @MaxLength(255)
  store_name?: string | null;

  @ApiPropertyOptional({ example: 42 })
  @IsOptional()
  @ValidateIf((o) => o.seller_id !== null)
  @Type(() => Number)
  @IsInt()
  seller_id?: number | null;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/banner.webp' })
  @IsOptional()
  @ValidateIf((o) => o.image_url !== null)
  @IsString()
  @MaxLength(500)
  image_url?: string | null;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/bg-banner.webp' })
  @IsOptional()
  @ValidateIf((o) => o.background_image_url !== null)
  @IsString()
  @MaxLength(500)
  background_image_url?: string | null;

  @ApiPropertyOptional({ example: 3 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  display_order?: number;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  is_members_only?: boolean;
}
