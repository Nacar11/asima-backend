import { ApiProperty } from '@nestjs/swagger';
import { ProductAttribute } from './product-attribute';

export class FindAllProductAttribute {
  @ApiProperty({ type: [ProductAttribute] })
  data: ProductAttribute[];

  @ApiProperty({ example: 10 })
  totalCount: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 10 })
  limit: number;
}
