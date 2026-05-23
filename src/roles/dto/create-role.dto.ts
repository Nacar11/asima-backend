import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ArrayUnique, IsArray, IsInt, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateRoleDto {
  @ApiProperty({ example: 'SUPERVISOR' })
  @IsString()
  @MaxLength(64)
  name!: string;

  @ApiPropertyOptional({ example: 'Field supervisor with limited admin capability' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string | null;

  @ApiProperty({ example: [1, 2, 3], type: [Number] })
  @IsArray()
  @ArrayUnique()
  @IsInt({ each: true })
  permission_ids!: number[];
}
