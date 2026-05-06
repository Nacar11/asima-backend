import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';

export class UpdateEdistrictStatusDto {
  @ApiProperty({
    example: 'active',
    enum: ['active', 'inactive', 'coming_soon'],
  })
  @IsIn(['active', 'inactive', 'coming_soon'])
  status: 'active' | 'inactive' | 'coming_soon';
}
