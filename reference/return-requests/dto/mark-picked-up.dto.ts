import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class MarkPickedUpDto {
  @ApiPropertyOptional({
    description: 'Notes about the pickup',
    example: 'Item collected from customer. Package appears intact.',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  @Transform(({ value }) => value?.trim())
  notes?: string;
}
