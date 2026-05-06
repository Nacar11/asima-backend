import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateShippingMethodDto } from './create-shipping-method.dto';

/**
 * DTO for updating a shipping method
 * Provider ID cannot be changed after creation
 */
export class UpdateShippingMethodDto extends PartialType(
  OmitType(CreateShippingMethodDto, ['provider_id'] as const),
) {}
