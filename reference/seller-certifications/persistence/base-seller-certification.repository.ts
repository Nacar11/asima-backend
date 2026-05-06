import { SellerCertification } from '@/seller-certifications/domain/seller-certification';
import { QuerySellerCertificationDto } from '@/seller-certifications/dto/query-seller-certification.dto';

export abstract class BaseSellerCertificationRepository {
  abstract create(
    data: Omit<
      SellerCertification,
      'id' | 'created_at' | 'updated_at' | 'deleted_at'
    >,
  ): Promise<SellerCertification>;

  abstract findAll(
    query: QuerySellerCertificationDto,
  ): Promise<{ data: SellerCertification[]; totalCount: number }>;

  abstract findById(id: number): Promise<SellerCertification | null>;

  abstract update(
    id: number,
    payload: Partial<SellerCertification>,
  ): Promise<SellerCertification>;

  abstract remove(id: number, causerId?: number): Promise<void>;
}
