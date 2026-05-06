import { SellerMemberService } from '@/seller-member-services/domain/seller-member-service';

export abstract class BaseSellerMemberServiceRepository {
  abstract create(data: SellerMemberService): Promise<SellerMemberService>;

  abstract findById(id: number): Promise<SellerMemberService | null>;

  abstract findAll(): Promise<SellerMemberService[]>;

  abstract update(
    id: number,
    payload: Partial<SellerMemberService>,
  ): Promise<SellerMemberService>;

  abstract remove(id: number): Promise<void>;
}
