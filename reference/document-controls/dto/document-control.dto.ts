import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsInt } from 'class-validator';

export class DocumentControlDto {
  @ApiProperty()
  @IsInt()
  @IsNotEmpty()
  id: number;
}
