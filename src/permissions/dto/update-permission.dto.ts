import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdatePermissionDto {
  @ApiPropertyOptional({ description: 'Updated human-readable description.' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;
}
