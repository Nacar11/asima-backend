import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';

export class ExtendMembershipDto {
  @ApiProperty({ type: Number, example: 30 })
  @IsInt()
  @Min(1)
  extension_days: number;
}
