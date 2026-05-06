import { SellerMember } from '@/seller-members/domain/seller-member';
import { FindAllSellerMembersDto } from '@/seller-members/dto/find-all-seller-members.dto';

export abstract class BaseSellerMemberRepository {
  abstract create(member: SellerMember): Promise<SellerMember>;

  abstract findAll(
    params: FindAllSellerMembersDto,
  ): Promise<{ data: SellerMember[]; totalCount: number }>;

  abstract findById(id: number): Promise<SellerMember | null>;

  abstract findByUserId(userId: number): Promise<SellerMember | null>;

  abstract update(
    id: number,
    payload: Partial<SellerMember>,
  ): Promise<SellerMember>;

  abstract remove(id: number): Promise<void>;
}
