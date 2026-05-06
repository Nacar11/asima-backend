import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { DisputeStatusEnum } from '../enums/dispute-status.enum';

/**
 * DTO for querying disputes with filtering and pagination.
 *
 * @version 1
 * @since 1.0.0
 */
export class QueryDisputeDto {
  @ApiPropertyOptional({ enum: DisputeStatusEnum })
  @IsOptional()
  @IsEnum(DisputeStatusEnum)
  status?: DisputeStatusEnum;

  @ApiPropertyOptional({ type: Number, example: 1 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  booking_id?: number;

  @ApiPropertyOptional({ type: Number, example: 1 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  customer_id?: number;

  @ApiPropertyOptional({ type: Number, example: 1 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  seller_id?: number;

  @ApiPropertyOptional({ type: Number, default: 1 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  page?: number;

  @ApiPropertyOptional({ type: Number, default: 20 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  limit?: number;
}
