import { PartialType } from '@nestjs/swagger';
import { CreateSellerPayoutAccountDto } from './create-seller-payout-account.dto';

/**
 * DTO for updating a seller payout account.
 *
 * @version 1
 * @since 1.0.0
 */
export class UpdateSellerPayoutAccountDto extends PartialType(
  CreateSellerPayoutAccountDto,
) {}
