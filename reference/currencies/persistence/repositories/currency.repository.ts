import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  FindManyOptions,
  FindOptionsWhere,
  ILike,
  FindOptionsOrder,
  Repository,
} from 'typeorm';
import { CurrencyEntity } from '@/currencies/persistence/entities/currency.entity';
import { Currency } from '@/currencies/domain/currency';
import { BaseCurrencyRepository } from '@/currencies/persistence/base-currency.repository';
import { CurrencyMapper } from '@/currencies/persistence/mappers/currency.mapper';

@Injectable()
export class CurrencyRepository implements BaseCurrencyRepository {
  constructor(
    @InjectRepository(CurrencyEntity)
    private readonly currencyRepo: Repository<CurrencyEntity>,
  ) {}

  async create(data: Currency): Promise<Currency> {
    const persistenceModel = CurrencyMapper.toPersistence(data);
    const saved = await this.currencyRepo.save(
      this.currencyRepo.create(persistenceModel),
    );

    return CurrencyMapper.toDomain(saved);
  }

  async findAll(params: {
    search?: string;
    skip?: number;
    take?: number;
    status?: string;
  }): Promise<{ data: Currency[]; totalCount: number }> {
    const { search, status } = params;
    const skip = params.skip ?? 0;
    const take = params.take ?? 50;

    const baseWhere: FindOptionsWhere<CurrencyEntity> = {};
    if (status) {
      baseWhere.status = status;
    }

    const where: FindOptionsWhere<CurrencyEntity>[] = [];
    if (search) {
      const like = ILike(`%${search}%`);
      where.push({ ...baseWhere, code: like });
      where.push({ ...baseWhere, name: like });
    } else {
      where.push(baseWhere);
    }

    const [entities, totalCount] = await this.currencyRepo.findAndCount({
      where,
      take,
      skip,
      order: { code: 'ASC' } as FindOptionsOrder<CurrencyEntity>,
      relations: this.getRelations(),
    });

    return {
      data: entities.map((entity) => CurrencyMapper.toDomain(entity)),
      totalCount,
    };
  }

  async findById(id: Currency['id']): Promise<Currency | null> {
    const entity = await this.currencyRepo.findOne({
      where: { id: Number(id) },
      relations: this.getRelations(),
      withDeleted: true,
    });

    return entity ? CurrencyMapper.toDomain(entity) : null;
  }

  async findByCode(code: Currency['code']): Promise<Currency | null> {
    if (!code) return null;

    const entity = await this.currencyRepo.findOne({
      where: { code },
      relations: this.getRelations(),
      withDeleted: true,
    });

    return entity ? CurrencyMapper.toDomain(entity) : null;
  }

  async update(
    id: Currency['id'],
    payload: Partial<Currency>,
  ): Promise<Currency> {
    const entity = await this.currencyRepo.findOne({
      where: { id: Number(id) },
    });

    if (!entity) throw new NotFoundException('Currency does not exist!');

    const updated = await this.currencyRepo.save(
      this.currencyRepo.create(
        CurrencyMapper.toPersistence({
          ...CurrencyMapper.toDomain(entity),
          ...payload,
        }),
      ),
    );

    return CurrencyMapper.toDomain(updated);
  }

  async remove(id: Currency['id'], causerId?: number): Promise<void> {
    const entity = await this.currencyRepo.findOne({
      where: { id: Number(id) },
    });

    if (!entity) throw new NotFoundException('Currency does not exist!');

    const deleted_at = new Date();

    await this.currencyRepo.update(id, {
      status: 'Inactive',
      deleted_at,
      deleted_by: causerId ? ({ id: causerId } as any) : null,
    });
  }

  private getRelations(): FindManyOptions<CurrencyEntity>['relations'] {
    return {
      created_by: true,
      updated_by: true,
      deleted_by: true,
    };
  }
}
