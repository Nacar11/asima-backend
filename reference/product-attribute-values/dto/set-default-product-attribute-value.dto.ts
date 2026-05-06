import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO for setting a product attribute value as default
 */
export class SetDefaultProductAttributeValueDto {
  @ApiProperty({
    description: 'The ID of the product attribute value to set as default',
  })
  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  id: number;
}
