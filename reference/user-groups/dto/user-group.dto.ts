import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsInt } from 'class-validator';

export class UserGroupDto {
  @ApiProperty()
  @IsInt()
  @IsNotEmpty()
  id: number;
}
