import { PartialType } from '@nestjs/swagger';
import { CreateSellerMemberDto } from './create-seller-member.dto';

export class UpdateSellerMemberDto extends PartialType(CreateSellerMemberDto) {}
