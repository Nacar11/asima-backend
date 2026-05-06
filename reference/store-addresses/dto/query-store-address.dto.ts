import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsOptional, Min } from 'class-validator';

export class QueryStoreAddressDto {
  @ApiProperty({
    type: Number,
    description: 'Filter by seller ID (required)',
    example: 5,
  })
  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  seller_id: number;

  @ApiPropertyOptional({
    type: Number,
    description: 'Number of records to skip',
    default: 0,
    minimum: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  skip?: number = 0;

  @ApiPropertyOptional({
    type: Number,
    description: 'Number of records to return',
    default: 20,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  take?: number = 20;
}
