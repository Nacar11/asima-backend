import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Transform, Type, plainToInstance } from 'class-transformer';
import { User } from '@/users/domain/user';
import { RoleDto } from '@/roles/dto/role.dto';

export class FilterUserDto {
  @ApiPropertyOptional({ type: RoleDto })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => RoleDto)
  roles?: RoleDto[] | null;
}

export class SortUserDto {
  @ApiProperty()
  @Type(() => String)
  @IsString()
  orderBy: keyof User;

  @ApiProperty()
  @IsString()
  order: string;
}

export class QueryUserDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  role?: string;

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

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @Transform(({ value }) => {
    return value ? plainToInstance(SortUserDto, JSON.parse(value)) : undefined;
  })
  @ValidateNested({ each: true })
  @Type(() => SortUserDto)
  sort?: SortUserDto[] | null;
}
