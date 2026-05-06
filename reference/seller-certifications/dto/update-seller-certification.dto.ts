import { PartialType } from '@nestjs/swagger';
import { CreateSellerCertificationDto } from './create-seller-certification.dto';

export class UpdateSellerCertificationDto extends PartialType(
  CreateSellerCertificationDto,
) {}
