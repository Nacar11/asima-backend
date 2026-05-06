import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsInt } from 'class-validator';

export class MenuDto {
  @ApiProperty()
  @IsInt()
  @IsNotEmpty()
  id: number;
}
