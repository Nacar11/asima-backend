import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';
import { ModerationActionTypeEnum } from '@/moderation/enums/moderation-action-type.enum';

/**
 * DTO for bulk moderation actions.
 *
 * @version 1
 * @since 1.0.0
 */
export class BulkModerationDto {
  @ApiProperty({
    description: 'Array of moderation item IDs',
    example: [1, 2, 3],
    type: [Number],
  })
  @IsArray()
  @IsInt({ each: true })
  @IsPositive({ each: true })
  moderation_item_ids: number[];

  @ApiProperty({
    enum: ModerationActionTypeEnum,
    example: ModerationActionTypeEnum.APPROVE,
    description: 'Action to take on all items',
  })
  @IsEnum(ModerationActionTypeEnum)
  action: ModerationActionTypeEnum;

  @ApiProperty({
    description: 'Reason for the action',
    example: 'Bulk approval of verified content',
  })
  @IsString()
  @IsNotEmpty()
  reason: string;

  @ApiPropertyOptional({
    description: 'Additional admin notes',
    example: 'Bulk reviewed and approved',
  })
  @IsOptional()
  @IsString()
  admin_notes?: string;
}
