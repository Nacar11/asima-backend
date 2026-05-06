import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsInt } from 'class-validator';

export class DocumentSignatoryDto {
  @ApiProperty()
  @IsInt()
  @IsNotEmpty()
  id: number;
}
