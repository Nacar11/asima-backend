import { IsEnum, IsOptional, IsString, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MediaTypeEnum } from '../domain/media-type.enum';

export class CreateMediaDto {
  @ApiProperty({
    enum: MediaTypeEnum,
    description: 'Type of media',
  })
  @IsEnum(MediaTypeEnum)
  media_type: MediaTypeEnum;

  @ApiProperty({
    description: 'File name',
    example: 'product-image.jpg',
  })
  @IsString()
  file_name: string;

  @ApiProperty({
    description: 'File path in storage',
    example: 'seller-123/products/image.jpg',
  })
  @IsString()
  file_path: string;

  @ApiProperty({
    description: 'File size in bytes',
    example: 1024000,
  })
  @IsNumber()
  file_size: number;

  @ApiProperty({
    description: 'MIME type',
    example: 'image/jpeg',
  })
  @IsString()
  mime_type: string;

  @ApiPropertyOptional({
    description: 'Image width in pixels',
    example: 1920,
  })
  @IsOptional()
  @IsNumber()
  width?: number;

  @ApiPropertyOptional({
    description: 'Image height in pixels',
    example: 1080,
  })
  @IsOptional()
  @IsNumber()
  height?: number;

  @ApiPropertyOptional({
    description: 'Video duration in seconds',
    example: 120,
  })
  @IsOptional()
  @IsNumber()
  duration?: number;

  @ApiPropertyOptional({
    description: 'Media title',
    example: 'Product Image - Front View',
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({
    description: 'Alternative text for accessibility',
    example: 'Product front view',
  })
  @IsOptional()
  @IsString()
  alt_text?: string;

  @ApiPropertyOptional({
    description: 'Media description',
    example: 'High quality product image showing details',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Seller ID',
    example: 123,
  })
  @IsOptional()
  @IsNumber()
  seller_id?: number;
}
