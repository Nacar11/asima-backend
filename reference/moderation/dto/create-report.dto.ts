import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';
import { ContentTypeEnum } from '@/moderation/enums/content-type.enum';

/**
 * DTO for creating a content report.
 *
 * @version 1
 * @since 1.0.0
 */
export class CreateReportDto {
  @ApiProperty({
    enum: ContentTypeEnum,
    example: ContentTypeEnum.SERVICE,
    description: 'Type of content being reported',
  })
  @IsEnum(ContentTypeEnum)
  content_type: ContentTypeEnum;

  @ApiProperty({
    description: 'ID of the content being reported',
    example: 123,
  })
  @IsInt()
  @IsPositive()
  content_id: number;

  @ApiProperty({
    description: 'Reason for reporting',
    example: 'Spam or misleading',
  })
  @IsString()
  @IsNotEmpty()
  reason: string;

  @ApiPropertyOptional({
    description: 'Additional details about the report',
    example: 'This service description contains false information',
  })
  @IsOptional()
  @IsString()
  details?: string;
}
