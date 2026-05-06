import { ApiProperty } from '@nestjs/swagger';
import { IsPositive } from 'class-validator';

export class CreateUserAssignmentDto {
  // Don't forget to use the class-validator decorators in the DTO properties.
  @ApiProperty({
    type: Number,
    required: true,
    example: 1,
  })
  @IsPositive()
  group: number;

  @ApiProperty({
    type: Number,
    required: true,
    example: 1,
  })
  @IsPositive()
  user: number;
}
