// Don't forget to use the class-validator decorators in the DTO properties.
// import { Allow } from 'class-validator';

import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { CreateCompanyDto } from './create-company.dto';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { MasterStatusEnum } from '@/utils/enums/status-enum';

export class UpdateCompanyDto extends PartialType(CreateCompanyDto) {
  @ApiPropertyOptional({
    type: () => String,
    example: MasterStatusEnum.ACTIVE,
  })
  @IsOptional()
  @IsString()
  @IsEnum(MasterStatusEnum)
  status?: MasterStatusEnum;
}
