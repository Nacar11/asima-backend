import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsInt } from 'class-validator';

export class SectionDto {
  @ApiProperty()
  @IsInt()
  @IsNotEmpty()
  id: number;
}
