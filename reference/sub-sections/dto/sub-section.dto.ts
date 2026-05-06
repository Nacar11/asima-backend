import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsInt } from 'class-validator';

export class SubSectionDto {
  @ApiProperty()
  @IsInt()
  @IsNotEmpty()
  id: number;
}
