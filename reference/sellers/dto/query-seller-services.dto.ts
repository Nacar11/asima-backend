import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { ServiceStatusEnum } from '@/services/enums/service-status.enum';

/**
 * Query DTO for getting seller's services
 */
export class QuerySellerServicesDto {
  @ApiPropertyOptional({
    type: Number,
    description: 'Number of items to skip',
    default: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  skip?: number;

  @ApiPropertyOptional({
    type: Number,
    description: 'Number of items to take',
    default: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  take?: number;

  @ApiPropertyOptional({
    type: String,
    description: 'Search term for service title',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    enum: ServiceStatusEnum,
    description: 'Filter by service status',
  })
  @IsOptional()
  @IsEnum(ServiceStatusEnum)
  status?: ServiceStatusEnum;

  @ApiPropertyOptional({
    type: Number,
    description: 'Filter by category ID',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  category_id?: number;
}
