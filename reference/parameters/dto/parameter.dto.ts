import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsInt } from 'class-validator';

export class ParameterDto {
  @ApiProperty()
  @IsInt()
  @IsNotEmpty()
  id: number;
}
