import { Exclude } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { User } from '@/users/domain/user';
import { ModerationActionTypeEnum } from '@/moderation/enums/moderation-action-type.enum';

/**
 * ModerationAction domain model.
 *
 * Represents an action taken on a moderation item.
 *
 * @version 1
 * @since 1.0.0
 */
export class ModerationAction {
  @ApiProperty({
    type: Number,
    example: 1,
    description: 'Moderation action ID',
  })
  id: number;

  @ApiProperty({
    type: Number,
    example: 1,
    description: 'Moderation item ID',
  })
  moderation_item_id: number;

  @ApiProperty({
    enum: ModerationActionTypeEnum,
    example: ModerationActionTypeEnum.APPROVE,
    description: 'Action taken',
  })
  action: ModerationActionTypeEnum;

  @ApiProperty({
    type: String,
    example: 'Content complies with community guidelines',
    description: 'Reason for the action',
  })
  reason: string;

  @ApiPropertyOptional({
    type: String,
    example: 'Reviewed and approved',
    description: 'Additional admin notes',
    nullable: true,
  })
  admin_notes?: string | null;

  @ApiProperty({
    type: Number,
    example: 1,
    description: 'Admin user ID who performed the action',
  })
  performed_by: number;

  @ApiPropertyOptional({
    type: () => User,
    description: 'Admin who performed the action',
  })
  performer?: Pick<User, 'id' | 'first_name' | 'last_name'>;

  @ApiProperty({
    type: Date,
    example: '2025-12-20T10:30:00Z',
    description: 'When the action was performed',
  })
  performed_at: Date;

  @Exclude()
  __entity?: string;
}
