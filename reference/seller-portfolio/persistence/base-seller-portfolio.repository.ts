import { SellerPortfolio } from '@/seller-portfolio/domain/seller-portfolio';
import { QuerySellerPortfolioDto } from '@/seller-portfolio/dto/query-seller-portfolio.dto';

export abstract class BaseSellerPortfolioRepository {
  abstract create(
    data: Omit<
      SellerPortfolio,
      'id' | 'created_at' | 'updated_at' | 'deleted_at'
    >,
  ): Promise<SellerPortfolio>;

  abstract findAll(
    query: QuerySellerPortfolioDto,
  ): Promise<{ data: SellerPortfolio[]; totalCount: number }>;

  abstract findById(id: number): Promise<SellerPortfolio | null>;

  abstract update(
    id: number,
    payload: Partial<SellerPortfolio>,
  ): Promise<SellerPortfolio>;

  abstract remove(id: number, causerId?: number): Promise<void>;
}
