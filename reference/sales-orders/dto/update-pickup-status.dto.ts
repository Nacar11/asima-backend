import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdatePickupStatusDto {
  @ApiPropertyOptional({
    description: 'Notes explaining the status change',
    example: 'Order is ready at the counter',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  status_notes?: string;
}
