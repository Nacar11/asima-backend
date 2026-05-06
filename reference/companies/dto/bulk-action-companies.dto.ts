import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsInt } from 'class-validator';

export class BulkActionCompaniesDto {
  @ApiProperty({})
  @IsArray()
  @IsNotEmpty()
  @IsInt({ each: true })
  ids: number[];
}
