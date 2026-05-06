import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsInt } from 'class-validator';

export class DepartmentDto {
  @ApiProperty()
  @IsInt()
  @IsNotEmpty()
  id: number;
}
