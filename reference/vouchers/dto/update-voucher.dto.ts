import { PartialType } from '@nestjs/swagger';
import { CreateVoucherDto } from '@/vouchers/dto/create-voucher.dto';

/**
 * DTO for updating a voucher.
 */
export class UpdateVoucherDto extends PartialType(CreateVoucherDto) {}
