import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateStoreMemberDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  first_name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  last_name?: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  phone?: string | null;
}
