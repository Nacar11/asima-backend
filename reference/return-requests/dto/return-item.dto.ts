import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class ReturnItemDto {
  @ApiProperty({
    description: 'Sales order item ID',
    example: 1,
  })
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  sales_order_item_id: number;

  @ApiProperty({
    description: 'Quantity to return',
    example: 1,
    minimum: 1,
  })
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  quantity: number;
}
