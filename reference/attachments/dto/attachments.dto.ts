import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsInt } from 'class-validator';

export class AttachmentsDto {
  @ApiProperty()
  @IsInt()
  @IsNotEmpty()
  id: number;
}
