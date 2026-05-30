import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class QueryPendingApprovalsDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Transform(({ value }) =>
    value === undefined || value === '' ? undefined : parseInt(value, 10),
  )
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Transform(({ value }) =>
    value === undefined || value === '' ? undefined : parseInt(value, 10),
  )
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
