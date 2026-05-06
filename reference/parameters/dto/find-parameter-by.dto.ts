import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export class FindParameterByDto {
  @ApiPropertyOptional()
  @Transform(({ value }) => (value ? String(value) : ''))
  @IsString()
  @IsOptional()
  code?: string;

  @ApiPropertyOptional()
  @Transform(({ value }) => (value ? String(value) : ''))
  @IsString()
  @IsOptional()
  param_item?: string;
}
