import { IsOptional, IsString, IsEnum, IsNumber } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { StatusEnum } from '@/utils/enums/status-enum';
import { MediaTypeEnum } from '@/media/domain/media-type.enum';

export class UpdateMediaDto {
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
    description: 'Media status',
    enum: StatusEnum,
    example: StatusEnum.ACTIVE,
  })
  @IsOptional()
  @IsEnum(StatusEnum)
  status?: StatusEnum;

  // File-related fields (set internally when file is replaced)
  @IsOptional()
  @IsString()
  file_name?: string;

  @IsOptional()
  @IsString()
  file_path?: string;

  @IsOptional()
  @IsNumber()
  file_size?: number;

  @IsOptional()
  @IsString()
  mime_type?: string;

  @IsOptional()
  @IsEnum(MediaTypeEnum)
  media_type?: MediaTypeEnum;
}
