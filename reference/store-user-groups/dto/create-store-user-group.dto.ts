import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsArray,
  IsOptional,
  MinLength,
  MaxLength,
  ValidateNested,
  IsInt,
} from 'class-validator';
import { Type } from 'class-transformer';

class StoreUserPermissionDto {
  @ApiProperty()
  @IsInt()
  menu_id: number;

  @ApiProperty({ type: [String] })
  @IsArray()
  permissions: string[];
}

class StoreMemberDto {
  @ApiProperty()
  @IsInt()
  user_id: number;
}

export class CreateStoreUserGroupDto {
  @ApiProperty()
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  group_name: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  @ApiProperty({ type: [StoreMemberDto], required: false })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => StoreMemberDto)
  members?: StoreMemberDto[];

  @ApiProperty({ type: [StoreUserPermissionDto], required: false })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => StoreUserPermissionDto)
  menus?: StoreUserPermissionDto[];
}
