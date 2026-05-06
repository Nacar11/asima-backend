import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateServiceOptionGroupDto } from './create-service-option-group.dto';

export class UpdateServiceOptionGroupDto extends PartialType(
  OmitType(CreateServiceOptionGroupDto, ['service_id'] as const),
) {}
