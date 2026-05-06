import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsIn,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';

export class CreateTagDto {
  @ApiProperty({
    type: String,
    example: 'organic',
    description:
      'Tag name (2-100 characters, alphanumeric, spaces, hyphens, underscores, must be unique)',
    minLength: 2,
    maxLength: 100,
  })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  @Matches(/^[a-zA-Z0-9\s\-_]+$/, {
    message:
      'Tag name can only contain letters, numbers, spaces, hyphens, and underscores',
  })
  name: string;

  @ApiPropertyOptional({
    type: String,
    example: 'Products that are organically grown',
    description: 'Optional description of the tag (max 200 characters)',
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  description?: string;

  @ApiPropertyOptional({
    type: String,
    example: 'organic-products',
    description:
      'Optional URL-friendly slug (2-100 characters, lowercase alphanumeric and hyphens only). If not provided, will be auto-generated from name',
    minLength: 2,
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  @Matches(/^[a-z0-9-]+$/, {
    message: 'Slug must be lowercase alphanumeric with hyphens only',
  })
  slug?: string;

  @ApiPropertyOptional({
    enum: ['Active', 'Inactive'],
    example: 'Active',
    default: 'Active',
    description: 'Tag status: Active or Inactive',
  })
  @IsOptional()
  @IsIn(['Active', 'Inactive'])
  status?: string;
}
