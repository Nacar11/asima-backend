import { Injectable, NotFoundException } from '@nestjs/common';
import { BaseSellerPortfolioRepository } from '@/seller-portfolio/persistence/base-seller-portfolio.repository';
import { SellerPortfolio } from '@/seller-portfolio/domain/seller-portfolio';
import { CreateSellerPortfolioDto } from '@/seller-portfolio/dto/create-seller-portfolio.dto';
import { UpdateSellerPortfolioDto } from '@/seller-portfolio/dto/update-seller-portfolio.dto';
import { QuerySellerPortfolioDto } from '@/seller-portfolio/dto/query-seller-portfolio.dto';
import { User } from '@/users/domain/user';
import { SellersService } from '@/sellers/sellers.service';

@Injectable()
export class SellerPortfolioService {
  constructor(
    private readonly repository: BaseSellerPortfolioRepository,
    private readonly sellersService: SellersService,
  ) {}

  async create(
    dto: CreateSellerPortfolioDto,
    causer: User,
  ): Promise<SellerPortfolio> {
    // Verify seller exists
    await this.sellersService.findById(dto.seller_id);

    const portfolio = Object.assign(new SellerPortfolio(), dto, {
      display_order: dto.display_order ?? 0,
      status: dto.status ?? 'Active',
      created_by: causer,
      updated_by: causer,
    });

    return this.repository.create(portfolio);
  }

  async findAll(query: QuerySellerPortfolioDto): Promise<{
    data: SellerPortfolio[];
    totalCount: number;
  }> {
    return this.repository.findAll(query);
  }

  async findById(id: number): Promise<SellerPortfolio> {
    const portfolio = await this.repository.findById(id);
    if (!portfolio) {
      throw new NotFoundException('Seller Portfolio not found');
    }
    return portfolio;
  }

  async update(
    id: number,
    dto: UpdateSellerPortfolioDto,
    causer: User,
  ): Promise<SellerPortfolio> {
    await this.findById(id);

    if (dto.seller_id) {
      await this.sellersService.findById(dto.seller_id);
    }

    return this.repository.update(id, {
      ...dto,
      updated_by: causer,
    });
  }

  async remove(id: number, causer: User): Promise<void> {
    await this.findById(id);
    await this.repository.remove(id, causer?.id);
  }
}
