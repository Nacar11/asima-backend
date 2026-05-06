// Don't forget to use the class-validator decorators in the DTO properties.
// import { Allow } from 'class-validator';

import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { CreateDocumentSignatoryDto } from './create-document-signatory.dto';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { MasterStatusEnum } from '@/utils/enums/status-enum';

export class UpdateDocumentSignatoryDto extends PartialType(
  CreateDocumentSignatoryDto,
) {
  @ApiPropertyOptional({
    type: () => String,
    example: MasterStatusEnum.ACTIVE,
  })
  @IsOptional()
  @IsString()
  @IsEnum(MasterStatusEnum)
  status?: MasterStatusEnum;
}
