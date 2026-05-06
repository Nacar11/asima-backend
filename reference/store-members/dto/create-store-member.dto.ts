import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsEmail,
  IsOptional,
  MinLength,
  MaxLength,
  IsInt,
} from 'class-validator';

export class CreateStoreMemberDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  first_name: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  last_name: string;

  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  phone?: string;

  @ApiProperty({
    required: false,
    description: 'Optional group to assign (must be a store group)',
  })
  @IsInt()
  @IsOptional()
  group_id?: number;
}
