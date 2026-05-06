import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class QuerySellerScheduleDto {
  @ApiPropertyOptional({ type: Number, example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  seller_id?: number;

  @ApiPropertyOptional({ type: Number, example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(6)
  day_of_week?: number;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ type: Number, example: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  skip?: number;

  @ApiPropertyOptional({ type: Number, example: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  take?: number;
}
