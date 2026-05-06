import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min, Max } from 'class-validator';

export class ExtendGracePeriodDto {
  @ApiProperty({
    description: 'Grace period extension in minutes (1–480)',
    example: 30,
    minimum: 1,
    maximum: 480,
  })
  @IsInt()
  @Min(1)
  @Max(480)
  extension_minutes: number;
}
