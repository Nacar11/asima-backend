import { PartialType } from '@nestjs/swagger';
import { CreateSellerPayoutDto } from './create-seller-payout.dto';

/**
 * DTO for updating a seller payout.
 *
 * @version 1
 * @since 1.0.0
 */
export class UpdateSellerPayoutDto extends PartialType(CreateSellerPayoutDto) {}
