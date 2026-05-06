import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';
import { SubscriptionOperationTypeEnum } from '@/admin-subscriptions/enums/subscription-operation-type.enum';

/**
 * DTO for bulk subscription operations.
 *
 * @version 1
 * @since 1.0.0
 */
export class BulkActionDto {
  @ApiProperty({
    description: 'Array of subscription IDs',
    example: [1, 2, 3],
    type: [Number],
  })
  @IsArray()
  @IsInt({ each: true })
  @IsPositive({ each: true })
  subscription_ids: number[];

  @ApiProperty({
    enum: SubscriptionOperationTypeEnum,
    example: SubscriptionOperationTypeEnum.RENEW,
    description: 'Operation type to perform on all subscriptions',
  })
  @IsEnum(SubscriptionOperationTypeEnum)
  operation_type: SubscriptionOperationTypeEnum;

  @ApiPropertyOptional({
    description: 'Reason for bulk operation',
    example: 'Bulk renewal after system maintenance',
  })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional({
    description: 'Additional metadata (e.g., days for extend operation)',
    example: { days: 30 },
  })
  @IsOptional()
  metadata?: any;
}
