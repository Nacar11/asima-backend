import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CancelMembershipDto {
  @ApiPropertyOptional({
    type: String,
    example: 'User requested cancellation.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  cancellation_reason?: string;
}
