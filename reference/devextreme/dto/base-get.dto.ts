import { IsOptional } from 'class-validator';
import { TransformSort } from '../devextreme.decorator';
import { SortTransformType } from '../devextreme.type';
import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class BaseGetDto {
  @ApiPropertyOptional({
    type: Number,
    description: 'Number of records to be return',
    example: 10,
  })
  @IsOptional()
  take: number;

  @ApiPropertyOptional({
    type: Number,
    description: 'Number of records to be skip',
    example: 0,
  })
  @IsOptional()
  skip: number;

  @ApiPropertyOptional({
    type: String,
    description: 'Record sorting',
    example: '[{"selector":"section","desc":false}]',
  })
  @IsOptional()
  @TransformSort()
  sort: SortTransformType;

  @ApiPropertyOptional({
    type: String,
    description: 'Record filtering',
    example: '["status","=","Active"]',
  })
  @IsOptional()
  @Transform(({ value }) => JSON.parse(value))
  filter: (string | string[])[] = [];
}
