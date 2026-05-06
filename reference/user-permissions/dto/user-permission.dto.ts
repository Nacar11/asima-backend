import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsInt } from 'class-validator';

export class UserPermissionDto {
  @ApiProperty()
  @IsInt()
  @IsNotEmpty()
  id: number;
}
