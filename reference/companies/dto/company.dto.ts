import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsInt } from 'class-validator';

export class CompanyDto {
  @ApiProperty()
  @IsInt()
  @IsNotEmpty()
  id: number;
}
