import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
} from 'class-validator';
import { RecordTypeEnum, StatusEnum } from '@/attachments/attachments.enum';

export class CreateAttachmentsDto {
  @ApiPropertyOptional({
    type: Number,
    required: false,
    description: 'Attachment ID',
    example: null,
  })
  @IsOptional()
  @IsInt()
  id?: number;

  @ApiPropertyOptional({
    type: Number,
    description:
      'Indicates the ID of record this attachment is linked to. If created under employee certifications, leave null.',
    required: false,
    example: 1,
  })
  @IsNumber()
  @IsOptional()
  record_id: number;

  @ApiProperty({
    type: String,
    enum: RecordTypeEnum,
    description: 'Indicates the type of record this attachment is linked to.',
    required: true,
    example: RecordTypeEnum.EMPLOYEE_CERTIFICATE,
  })
  @IsString()
  @IsNotEmpty()
  record_type: RecordTypeEnum;

  @ApiProperty({
    type: String,
    description: 'Path or URL to the stored file.',
    required: true,
    example:
      'https://static.remove.bg/sample-gallery/graphics/bird-thumbnail.jpg',
  })
  @IsUrl()
  @IsNotEmpty()
  file_path: string;

  @ApiPropertyOptional({
    type: String,
    description: 'Status of the attachment.',
    required: false,
    example: StatusEnum.ACTIVE,
  })
  @IsEnum(StatusEnum)
  @IsOptional()
  status?: StatusEnum;
}
