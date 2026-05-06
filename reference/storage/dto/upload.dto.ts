import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional, IsString, ValidateIf } from 'class-validator';
import { Base64ToMulterPipe } from '../storage.pipe';
import { IsValidFileUpload } from '../storage.decorator';

@IsValidFileUpload()
export class UploadStorageDto {
  @ApiProperty({
    description: 'File name',
    type: 'string',
  })
  @IsString()
  filename: string;

  @ApiPropertyOptional({
    description: 'The file to upload (binary format)',
    type: 'string',
    format: 'binary',
  })
  @ValidateIf((o) => !o.base64_file)
  @IsOptional()
  file?: Express.Multer.File;

  @ApiPropertyOptional({
    description: 'The file to upload (base64 encoded)',
    type: 'string',
  })
  @ValidateIf((o) => !o.file)
  @Transform(({ value }) => {
    if (!value) return undefined;
    const pipe = new Base64ToMulterPipe();
    return pipe.transform(value);
  })
  base64_file?: Express.Multer.File;

  @ApiPropertyOptional({
    description: 'Folder path',
    type: 'string',
  })
  @IsOptional()
  @IsString()
  folder_path?: string;
}
