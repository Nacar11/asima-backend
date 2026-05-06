// Don't forget to use the class-validator decorators in the DTO properties.
// import { Allow } from 'class-validator';
import { MasterStatusEnum } from '@/utils/enums/status-enum';
import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { CreateDocumentControlDto } from './create-document-control.dto';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class UpdateDocumentControlDto extends PartialType(
  CreateDocumentControlDto,
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
