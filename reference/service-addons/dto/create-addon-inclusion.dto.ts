import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateAddonInclusionDto {
  @ApiPropertyOptional({ type: Number, description: 'ID when updating' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  id?: number;

  @ApiProperty({ type: String, example: 'Deep cleaning of all surfaces' })
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiPropertyOptional({ type: Number, example: 0, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  display_order?: number;
}
