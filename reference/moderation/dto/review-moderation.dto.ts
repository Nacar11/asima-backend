import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ModerationActionTypeEnum } from '@/moderation/enums/moderation-action-type.enum';

/**
 * DTO for reviewing a moderation item.
 *
 * @version 1
 * @since 1.0.0
 */
export class ReviewModerationDto {
  @ApiProperty({
    enum: ModerationActionTypeEnum,
    example: ModerationActionTypeEnum.APPROVE,
    description: 'Action to take on the moderation item',
  })
  @IsEnum(ModerationActionTypeEnum)
  action: ModerationActionTypeEnum;

  @ApiProperty({
    description: 'Reason for the action',
    example: 'Content complies with community guidelines',
  })
  @IsString()
  @IsNotEmpty()
  reason: string;

  @ApiPropertyOptional({
    description: 'Additional admin notes',
    example: 'Reviewed and approved',
  })
  @IsOptional()
  @IsString()
  admin_notes?: string;
}
