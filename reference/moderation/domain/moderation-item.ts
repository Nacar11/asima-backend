import { Exclude } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { User } from '@/users/domain/user';
import { ContentTypeEnum } from '@/moderation/enums/content-type.enum';
import { ModerationStatusEnum } from '@/moderation/enums/moderation-status.enum';
import { ModerationPriorityEnum } from '@/moderation/enums/moderation-priority.enum';

/**
 * ModerationItem domain model.
 *
 * Represents an item in the moderation queue that needs to be reviewed.
 *
 * @version 1
 * @since 1.0.0
 */
export class ModerationItem {
  @ApiProperty({
    type: Number,
    example: 1,
    description: 'Moderation item ID',
  })
  id: number;

  @ApiProperty({
    enum: ContentTypeEnum,
    example: ContentTypeEnum.SERVICE,
    description: 'Type of content being moderated',
  })
  content_type: ContentTypeEnum;

  @ApiProperty({
    type: Number,
    example: 123,
    description: 'ID of the content being moderated',
  })
  content_id: number;

  @ApiPropertyOptional({
    type: Number,
    example: 5,
    description: 'User ID who reported the content',
    nullable: true,
  })
  reported_by?: number | null;

  @ApiPropertyOptional({
    type: () => User,
    description: 'User who reported the content',
    nullable: true,
  })
  reporter?: Pick<User, 'id' | 'first_name' | 'last_name'> | null;

  @ApiPropertyOptional({
    type: String,
    example: 'Inappropriate content',
    description: 'Reason for reporting',
    nullable: true,
  })
  reported_reason?: string | null;

  @ApiProperty({
    enum: ModerationStatusEnum,
    example: ModerationStatusEnum.PENDING,
    description: 'Moderation status',
  })
  status: ModerationStatusEnum;

  @ApiProperty({
    enum: ModerationPriorityEnum,
    example: ModerationPriorityEnum.MEDIUM,
    description: 'Priority level',
  })
  priority: ModerationPriorityEnum;

  @ApiPropertyOptional({
    type: Number,
    example: 1,
    description: 'Admin user ID who reviewed the item',
    nullable: true,
  })
  reviewed_by?: number | null;

  @ApiPropertyOptional({
    type: () => User,
    description: 'Admin who reviewed the item',
    nullable: true,
  })
  reviewer?: Pick<User, 'id' | 'first_name' | 'last_name'> | null;

  @ApiPropertyOptional({
    type: Date,
    example: '2025-12-20T10:30:00Z',
    description: 'When the item was reviewed',
    nullable: true,
  })
  reviewed_at?: Date | null;

  @ApiPropertyOptional({
    type: String,
    example: 'Content approved after review',
    description: 'Admin notes',
    nullable: true,
  })
  admin_notes?: string | null;

  @ApiProperty({
    type: Date,
    example: '2025-12-20T10:00:00Z',
    description: 'When the moderation item was created',
  })
  created_at: Date;

  @ApiProperty({
    type: Date,
    example: '2025-12-20T10:30:00Z',
    description: 'When the moderation item was last updated',
  })
  updated_at: Date;

  @Exclude()
  __entity?: string;
}
