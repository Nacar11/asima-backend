import { PartialType } from '@nestjs/swagger';
import { CreateShippingProviderDto } from './create-shipping-provider.dto';

/**
 * DTO for updating a shipping provider
 */
export class UpdateShippingProviderDto extends PartialType(
  CreateShippingProviderDto,
) {}
