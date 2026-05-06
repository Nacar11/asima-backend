import { ApiProperty } from '@nestjs/swagger';
import { ProductAttributeValue } from './product-attribute-value';

/**
 * Find all product attribute values result type
 */
export class FindAllProductAttributeValue {
  @ApiProperty({ description: 'Product attribute values array' })
  data: ProductAttributeValue[];

  @ApiProperty({ description: 'Total count of product attribute values' })
  totalCount: number;

  @ApiProperty({ description: 'Number of items skipped' })
  skip: number;

  @ApiProperty({ description: 'Number of items taken' })
  take: number;
}
