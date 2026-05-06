import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class ModerateServiceDto {
  @ApiPropertyOptional({ description: 'Reason or notes for moderation action' })
  @IsOptional()
  @IsString()
  reason?: string;
}
