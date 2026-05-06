import { PartialType } from '@nestjs/swagger';
import { CreateSellerMemberServiceDto } from './create-seller-member-service.dto';

export class UpdateSellerMemberServiceDto extends PartialType(
  CreateSellerMemberServiceDto,
) {}
