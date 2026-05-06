import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsPositive } from 'class-validator';

export class CreateUserAssignmentsDto {
  // Don't forget to use the class-validator decorators in the DTO properties.
  @ApiProperty({
    type: Number,
    required: true,
    example: 1,
  })
  @IsPositive()
  group: number;

  @ApiProperty({
    type: Array<number>,
    required: true,
    example: [1, 2, 3],
  })
  @IsArray()
  users: number[];
}
