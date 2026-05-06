import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class BulkExcludeDto {
  @ApiProperty()
  @IsOptional()
  @IsString()
  exclude_ids?: string;
}
