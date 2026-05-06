import { PartialType } from '@nestjs/swagger';
import { CreateSellerEarningDto } from './create-seller-earning.dto';

/**
 * DTO for updating a seller earning record.
 *
 * @version 1
 * @since 1.0.0
 */
export class UpdateSellerEarningDto extends PartialType(
  CreateSellerEarningDto,
) {}
