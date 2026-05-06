import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateServiceOptionValueDto } from './create-service-option-value.dto';

export class UpdateServiceOptionValueDto extends PartialType(
  OmitType(CreateServiceOptionValueDto, ['option_group_id'] as const),
) {}
