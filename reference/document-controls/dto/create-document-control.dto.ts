import { ApiProperty } from '@nestjs/swagger';
import { MasterStatusEnum } from '@/utils/enums/status-enum';
import {
  IsString,
  MaxLength,
  IsEnum,
  IsInt,
  IsOptional,
} from 'class-validator';

export class CreateDocumentControlDto {
  // Don't forget to use the class-validator decorators in the DTO properties.
  @ApiProperty({
    type: Number,
  })
  @IsInt()
  menu_id: number | null;

  @ApiProperty({
    type: String,
    example: 'PR{yy}-',
  })
  @IsString()
  @MaxLength(12)
  prefix_pattern: string;

  @ApiProperty({
    type: String,
    example: 1,
  })
  @IsInt()
  last_series: number;

  @ApiProperty({
    type: String,
    enum: MasterStatusEnum,
    description:
      'The current status of the document controls in the system (Active / Cancelled /Hold).',
    default: MasterStatusEnum.ACTIVE,
  })
  @IsEnum(MasterStatusEnum, {
    message: 'status must be a valid status from the enum',
  })
  @IsOptional()
  status: MasterStatusEnum;
}
