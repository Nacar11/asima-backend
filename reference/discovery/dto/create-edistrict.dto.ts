import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateEdistrictDto {
  @ApiProperty({
    example: 'minglanilla-tungkop',
    description: 'URL-safe kebab-case identifier, must be unique',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'key must be lowercase kebab-case (e.g. "my-district")',
  })
  key: string;

  @ApiProperty({ example: 'Minglanilla Tungkop' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name: string;

  @ApiPropertyOptional({ example: 'Browse services in Minglanilla' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  subtitle?: string;

  @ApiPropertyOptional({ example: 'Tungkop Sports Hub' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  store_name?: string;

  @ApiPropertyOptional({ example: 42 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  seller_id?: number;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/banner.webp' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  image_url?: string;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/bg-banner.webp' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  background_image_url?: string;

  @ApiPropertyOptional({ example: 3, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  display_order?: number;

  @ApiPropertyOptional({ example: false, default: false })
  @IsOptional()
  @IsBoolean()
  is_members_only?: boolean;
}
