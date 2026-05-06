import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional } from 'class-validator';

export class AssignStoreMemberDto {
  @ApiProperty()
  @IsInt()
  user_id: number;

  @ApiProperty({
    required: false,
    description: 'Optional group to assign',
  })
  @IsInt()
  @IsOptional()
  group_id?: number;
}
