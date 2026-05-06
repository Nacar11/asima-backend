import { StatusEnum } from '@/user-groups/user-groups.enum';
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayNotEmpty,
  ArrayUnique,
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class FindAllUserGroupsDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional()
  @Transform(({ value }) => (value ? Number(value) : 1))
  @IsNumber()
  @IsOptional()
  page?: number;

  @ApiPropertyOptional()
  @Transform(({ value }) => (value ? Number(value) : 10))
  @IsNumber()
  @IsOptional()
  limit?: number;

  @ApiPropertyOptional({
    type: String,
    default: StatusEnum.ACTIVE,
    example: `${StatusEnum.ACTIVE},${StatusEnum.CANCELLED}`,
  })
  @IsOptional()
  @Transform(({ value }) => value?.split(',').map((val) => val.trim()))
  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @IsEnum(StatusEnum, {
    each: true,
    message: 'Each status must be a valid status from the enum',
  })
  status?: StatusEnum[];
}
