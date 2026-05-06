import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';

export class UpdateReviewStatusDto {
  @ApiProperty({
    description: 'Review status',
    enum: ['Active', 'Removed'],
    enumName: 'ReviewStatus',
    example: 'Active',
  })
  @IsNotEmpty()
  @IsEnum(['Active', 'Removed'], {
    message: 'status must be one of the following values: Active, Removed',
  })
  status: 'Active' | 'Removed';
}
