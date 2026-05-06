import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsEnum,
  IsInt,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateSellerPortfolioDto {
  @ApiProperty({
    type: Number,
    example: 1,
    description: 'Seller ID this portfolio item belongs to',
  })
  @IsNumber()
  @Type(() => Number)
  @IsNotEmpty()
  seller_id: number;

  @ApiProperty({
    type: String,
    example: 'Website Redesign Project',
    description: 'Title of the portfolio item',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({
    type: String,
    example: 'A complete redesign of an e-commerce website...',
    description: 'Description of the portfolio item',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    type: String,
    example: 'https://example.com/portfolio-image.jpg',
    description: 'URL to the portfolio image',
  })
  @IsString()
  @IsNotEmpty()
  image_url: string;

  @ApiPropertyOptional({
    type: String,
    example: 'https://example.com/project-link',
    description: 'URL to the project or more details',
  })
  @IsOptional()
  @IsString()
  project_url?: string;

  @ApiPropertyOptional({
    type: Number,
    example: 1,
    description: 'Display order for sorting',
    default: 0,
  })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  display_order?: number;

  @ApiPropertyOptional({
    type: String,
    enum: ['Active', 'Inactive'],
    example: 'Active',
    default: 'Active',
  })
  @IsOptional()
  @IsEnum(['Active', 'Inactive'])
  status?: string;
}
