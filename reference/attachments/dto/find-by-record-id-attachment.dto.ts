import { IsEnum, IsNotEmpty } from 'class-validator';
import { RecordTypeEnum } from '@/attachments/attachments.enum';
import { ApiProperty } from '@nestjs/swagger';

export class FindByRecordIdAttachmentsDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsEnum(RecordTypeEnum, {
    message: 'record_type must be a valid RecordTypeEnum value',
  })
  record_type: RecordTypeEnum;
}
