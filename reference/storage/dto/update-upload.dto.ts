import { IsString } from 'class-validator';
import { UploadStorageDto } from './upload.dto';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUploadDto extends UploadStorageDto {
  @ApiProperty({
    description: 'Previous File Path',
    type: 'string',
  })
  @IsString()
  file_path: string;
}
