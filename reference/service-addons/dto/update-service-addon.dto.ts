import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateServiceAddonDto } from './create-service-addon.dto';

export class UpdateServiceAddonDto extends PartialType(
  OmitType(CreateServiceAddonDto, ['service_id'] as const),
) {}
