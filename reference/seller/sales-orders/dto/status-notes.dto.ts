import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class StatusNotesDto {
  @ApiPropertyOptional({
    description: 'Notes explaining the status change',
    example: 'Customer requested expedited processing',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  status_notes?: string;
}
