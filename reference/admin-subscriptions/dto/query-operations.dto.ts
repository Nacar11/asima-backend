import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { SubscriptionOperationTypeEnum } from '@/admin-subscriptions/enums/subscription-operation-type.enum';

/**
 * DTO for querying subscription operations.
 *
 * @version 1
 * @since 1.0.0
 */
export class QueryOperationsDto {
  @ApiPropertyOptional({
    description: 'Page number',
    example: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({
    description: 'Items per page',
    example: 20,
    default: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;

  @ApiPropertyOptional({
    type: Number,
    description: 'Filter by subscription ID',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  subscription_id?: number;

  @ApiPropertyOptional({
    enum: SubscriptionOperationTypeEnum,
    description: 'Filter by operation type',
  })
  @IsOptional()
  @IsEnum(SubscriptionOperationTypeEnum)
  operation_type?: SubscriptionOperationTypeEnum;
}
