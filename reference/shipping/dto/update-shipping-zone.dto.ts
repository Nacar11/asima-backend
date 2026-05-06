import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateShippingZoneDto } from './create-shipping-zone.dto';

/**
 * DTO for updating a shipping zone
 * Omits provider_id as it cannot be changed after creation
 */
export class UpdateShippingZoneDto extends PartialType(
  OmitType(CreateShippingZoneDto, ['provider_id'] as const),
) {}
