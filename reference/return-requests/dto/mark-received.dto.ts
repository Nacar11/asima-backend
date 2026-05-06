import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class MarkReceivedDto {
  @ApiPropertyOptional({
    description: 'Notes about receiving the items',
    example: 'Package received. All items present.',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  @Transform(({ value }) => value?.trim())
  notes?: string;
}
