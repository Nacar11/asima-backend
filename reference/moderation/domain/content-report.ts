import { Exclude } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { User } from '@/users/domain/user';
import { ContentTypeEnum } from '@/moderation/enums/content-type.enum';
import { ReportStatusEnum } from '@/moderation/enums/report-status.enum';

/**
 * ContentReport domain model.
 *
 * Represents a user report of inappropriate content.
 *
 * @version 1
 * @since 1.0.0
 */
export class ContentReport {
  @ApiProperty({
    type: Number,
    example: 1,
    description: 'Content report ID',
  })
  id: number;

  @ApiProperty({
    enum: ContentTypeEnum,
    example: ContentTypeEnum.SERVICE,
    description: 'Type of content being reported',
  })
  content_type: ContentTypeEnum;

  @ApiProperty({
    type: Number,
    example: 123,
    description: 'ID of the content being reported',
  })
  content_id: number;

  @ApiProperty({
    type: Number,
    example: 5,
    description: 'User ID who reported the content',
  })
  reported_by: number;

  @ApiPropertyOptional({
    type: () => User,
    description: 'User who reported the content',
  })
  reporter?: Pick<User, 'id' | 'first_name' | 'last_name'>;

  @ApiProperty({
    type: String,
    example: 'Spam or misleading',
    description: 'Reason for reporting',
  })
  reason: string;

  @ApiPropertyOptional({
    type: String,
    example: 'This service description contains false information',
    description: 'Additional details about the report',
    nullable: true,
  })
  details?: string | null;

  @ApiProperty({
    enum: ReportStatusEnum,
    example: ReportStatusEnum.PENDING,
    description: 'Report status',
  })
  status: ReportStatusEnum;

  @ApiProperty({
    type: Date,
    example: '2025-12-20T10:00:00Z',
    description: 'When the report was created',
  })
  created_at: Date;

  @Exclude()
  __entity?: string;
}
