import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsInt } from 'class-validator';

export class DivisionDto {
  @ApiProperty()
  @IsInt()
  @IsNotEmpty()
  id: number;
}
