import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsInt } from 'class-validator';

export class UserAssignmentDto {
  @ApiProperty()
  @IsInt()
  @IsNotEmpty()
  id: number;
}
