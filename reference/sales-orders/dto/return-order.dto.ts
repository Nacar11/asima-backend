import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class ReturnOrderDto {
  @ApiProperty({
    description: 'Reason for returning the order',
    example: 'Product damaged during shipping',
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(500)
  reason: string;
}
