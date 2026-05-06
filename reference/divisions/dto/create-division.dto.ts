import {
  IsString,
  Length,
  IsInt,
  IsOptional,
  IsEnum,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { StatusEnum } from '@/utils/enums/status-enum';

export class CreateDivisionDto {
  @ApiProperty({
    type: () => String,
    required: true,
    example: '00',
  })
  @IsString()
  @Length(2, 2)
  @Matches(/^(0[0-9]|[1-9][0-9])$/, {
    message: 'Code must only contain numbers between 00 and 99',
  })
  division_code: string;

  @ApiProperty({
    type: () => String,
    required: true,
    example: 'CODY',
  })
  @IsString()
  @Length(1, 100)
  division_name: string;

  @ApiProperty({
    type: Number,
    required: true,
    example: 1,
  })
  @IsInt()
  division_head: number;

  @ApiPropertyOptional({
    type: String,
    enum: StatusEnum,
    description: 'Cost Center status',
    default: StatusEnum.ACTIVE,
    example: StatusEnum.ACTIVE,
  })
  @IsOptional()
  @IsEnum(StatusEnum, {
    message: 'status must be a valid status from the enum',
  })
  status?: StatusEnum;
}
