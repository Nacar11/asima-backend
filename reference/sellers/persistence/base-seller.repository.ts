import { Seller } from '@/sellers/domain/seller';
import { FindAllSeller } from '@/sellers/domain/find-all-seller';
import { QuerySellerDto } from '@/sellers/dto/query-seller.dto';

/**
 * Abstract repository for seller persistence operations
 */
export abstract class BaseSellerRepository {
  abstract create(seller: Seller): Promise<Seller>;

  abstract findAll(query: QuerySellerDto): Promise<FindAllSeller>;

  abstract findById(id: number): Promise<Seller | null>;

  abstract findByUserId(userId: number): Promise<Seller | null>;

  abstract findByStoreName(storeName: string): Promise<Seller | null>;

  abstract findBySlug(slug: string): Promise<Seller | null>;

  abstract findFeatured(): Promise<Seller[]>;

  abstract update(id: number, seller: Partial<Seller>): Promise<Seller>;

  abstract remove(id: number): Promise<void>;
}
