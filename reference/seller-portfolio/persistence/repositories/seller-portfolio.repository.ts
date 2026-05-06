import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, ILike, Repository } from 'typeorm';
import { BaseSellerPortfolioRepository } from '@/seller-portfolio/persistence/base-seller-portfolio.repository';
import { SellerPortfolioEntity } from '@/seller-portfolio/persistence/entities/seller-portfolio.entity';
import { SellerPortfolioMapper } from '@/seller-portfolio/persistence/mappers/seller-portfolio.mapper';
import { SellerPortfolio } from '@/seller-portfolio/domain/seller-portfolio';
import { QuerySellerPortfolioDto } from '@/seller-portfolio/dto/query-seller-portfolio.dto';

@Injectable()
export class SellerPortfolioRepository
  implements BaseSellerPortfolioRepository
{
  constructor(
    @InjectRepository(SellerPortfolioEntity)
    private readonly repo: Repository<SellerPortfolioEntity>,
  ) {}

  async create(
    data: Omit<
      SellerPortfolio,
      'id' | 'created_at' | 'updated_at' | 'deleted_at'
    >,
  ): Promise<SellerPortfolio> {
    const entity = this.repo.create(SellerPortfolioMapper.toPersistence(data));
    const saved = await this.repo.save(entity);
    const withRelations = await this.repo.findOne({
      where: { id: saved.id },
      relations: ['created_by', 'updated_by'],
    });
    return SellerPortfolioMapper.toDomain(withRelations ?? saved);
  }

  async findAll(
    query: QuerySellerPortfolioDto,
  ): Promise<{ data: SellerPortfolio[]; totalCount: number }> {
    const skip = query.skip ?? 0;
    const take = query.take ?? 20;

    const where: FindOptionsWhere<SellerPortfolioEntity>[] = [];

    if (query.seller_id !== undefined) {
      where.push({ seller_id: query.seller_id });
    }
    if (query.status !== undefined) {
      where.push({ status: query.status });
    }
    if (query.search) {
      const like = ILike(`%${query.search}%`);
      where.push({ title: like });
      where.push({ description: like });
    }

    if (where.length === 0) where.push({});

    const [entities, totalCount] = await this.repo.findAndCount({
      where,
      skip,
      take,
      order: { display_order: 'ASC', created_at: 'DESC' },
      relations: ['created_by', 'updated_by'],
    });

    return {
      data: entities.map((e) => SellerPortfolioMapper.toDomain(e)),
      totalCount,
    };
  }

  async findById(id: number): Promise<SellerPortfolio | null> {
    const entity = await this.repo.findOne({
      where: { id },
      relations: ['created_by', 'updated_by'],
    });
    return entity ? SellerPortfolioMapper.toDomain(entity) : null;
  }

  async update(
    id: number,
    payload: Partial<SellerPortfolio>,
  ): Promise<SellerPortfolio> {
    const existing = await this.repo.findOne({ where: { id } });
    if (!existing) throw new NotFoundException('Seller Portfolio not found');

    await this.repo.save(
      this.repo.create({
        ...SellerPortfolioMapper.toPersistence(
          SellerPortfolioMapper.toDomain(existing),
        ),
        ...SellerPortfolioMapper.toPersistence(payload),
      }),
    );

    const updated = await this.repo.findOne({
      where: { id },
      relations: ['created_by', 'updated_by'],
    });
    return SellerPortfolioMapper.toDomain(updated!);
  }

  async remove(id: number, causerId?: number): Promise<void> {
    const existing = await this.repo.findOne({ where: { id } });
    if (!existing) throw new NotFoundException('Seller Portfolio not found');
    if (causerId) {
      await this.repo.save({
        id,
        deleted_by: { id: causerId } as any,
      });
    }
    await this.repo.softDelete(id);
  }
}
