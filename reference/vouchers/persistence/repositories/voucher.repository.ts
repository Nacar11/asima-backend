import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { BaseVoucherRepository } from '@/vouchers/persistence/base-voucher.repository';
import { VoucherEntity } from '@/vouchers/persistence/entities/voucher.entity';
import { VoucherMapper } from '@/vouchers/persistence/mappers/voucher.mapper';
import { Voucher } from '@/vouchers/domain/voucher';
import {
  parseScopeParam,
  QueryVoucherDto,
} from '@/vouchers/dto/query-voucher.dto';
import { FindAllVoucher } from '@/vouchers/domain/find-all-voucher';

@Injectable()
export class VoucherRepository extends BaseVoucherRepository {
  constructor(
    @InjectRepository(VoucherEntity)
    private readonly voucherRepository: Repository<VoucherEntity>,
  ) {
    super();
  }
  async create(voucher: Voucher): Promise<Voucher> {
    const entity: VoucherEntity = this.voucherRepository.create(
      VoucherMapper.toPersistence(voucher),
    );
    const savedEntity: VoucherEntity =
      await this.voucherRepository.save(entity);
    return VoucherMapper.toDomain(savedEntity);
  }
  async findAll(query: QueryVoucherDto): Promise<FindAllVoucher> {
    const skip: number = query.skip ?? 0;
    const take: number = query.take ?? 20;
    const queryBuilder = this.voucherRepository.createQueryBuilder('voucher');
    if (query.search) {
      queryBuilder.andWhere(
        '(voucher.code ILIKE :search OR voucher.description ILIKE :search)',
        { search: `%${query.search}%` },
      );
    }
    const scopes = parseScopeParam(query.scope);
    if (scopes.length) {
      queryBuilder.andWhere('voucher.scope IN (:...scopes)', { scopes });
    }
    if (query.status) {
      queryBuilder.andWhere('voucher.status = :status', {
        status: query.status,
      });
    }
    if (query.discount_type) {
      queryBuilder.andWhere('voucher.discount_type = :discountType', {
        discountType: query.discount_type,
      });
    }
    const shouldIncludeAdminVouchers: boolean =
      query.include_admin_vouchers === true;
    if (query.sellerId === null) {
      queryBuilder.andWhere('voucher.seller_id IS NULL');
    } else if (query.sellerId !== undefined) {
      if (shouldIncludeAdminVouchers) {
        queryBuilder.andWhere(
          new Brackets((qb) => {
            qb.where('voucher.seller_id = :sellerId', {
              sellerId: query.sellerId,
            }).orWhere('voucher.seller_id IS NULL');
          }),
        );
      } else {
        queryBuilder.andWhere('voucher.seller_id = :sellerId', {
          sellerId: query.sellerId,
        });
      }
    } else if (!shouldIncludeAdminVouchers) {
      queryBuilder.andWhere('voucher.seller_id IS NOT NULL');
    }
    queryBuilder.orderBy('voucher.created_at', 'DESC').skip(skip).take(take);
    const [entities, totalCount]: [VoucherEntity[], number] =
      await queryBuilder.getManyAndCount();
    return {
      data: entities.map((entity: VoucherEntity) =>
        VoucherMapper.toDomain(entity),
      ),
      totalCount,
      skip,
      take,
    };
  }
  async findById(id: number): Promise<Voucher | null> {
    const entity: VoucherEntity | null = await this.voucherRepository.findOne({
      where: { id },
    });
    return entity ? VoucherMapper.toDomain(entity) : null;
  }
  async findByCode(code: string): Promise<Voucher | null> {
    const entity: VoucherEntity | null = await this.voucherRepository
      .createQueryBuilder('voucher')
      .where('UPPER(voucher.code) = UPPER(:code)', { code })
      .getOne();
    return entity ? VoucherMapper.toDomain(entity) : null;
  }
  async update(id: number, voucher: Partial<Voucher>): Promise<Voucher> {
    const currentEntity: VoucherEntity | null =
      await this.voucherRepository.findOne({
        where: { id },
      });
    if (!currentEntity) {
      throw new Error('Voucher not found');
    }
    const mergedDomain: Voucher = {
      ...VoucherMapper.toDomain(currentEntity),
      ...voucher,
    } as Voucher;
    const savedEntity: VoucherEntity = await this.voucherRepository.save(
      this.voucherRepository.create(VoucherMapper.toPersistence(mergedDomain)),
    );
    return VoucherMapper.toDomain(savedEntity);
  }
  async remove(id: number): Promise<void> {
    await this.voucherRepository.softDelete(id);
  }
  async incrementUsedCount(id: number): Promise<void> {
    await this.voucherRepository.increment({ id }, 'used_count', 1);
  }
  async decrementUsedCount(id: number): Promise<void> {
    await this.voucherRepository
      .createQueryBuilder()
      .update()
      .set({ used_count: () => 'GREATEST(used_count - 1, 0)' })
      .where('id = :id', { id })
      .execute();
  }
}
