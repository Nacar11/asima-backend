import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { BaseGiftedVoucherLogRepository } from '@/gifted-voucher-logs/persistence/base-gifted-voucher-log.repository';
import { VoucherGiftLogEntity } from '@/vouchers/persistence/entities/voucher-gift-log.entity';
import { GiftedVoucherLogMapper } from '@/gifted-voucher-logs/persistence/mappers/gifted-voucher-log.mapper';
import { GiftedVoucherLog } from '@/gifted-voucher-logs/domain/gifted-voucher-log';
import { QueryGiftedVoucherLogDto } from '@/gifted-voucher-logs/dto/query-gifted-voucher-log.dto';

@Injectable()
export class GiftedVoucherLogRepository
  implements BaseGiftedVoucherLogRepository
{
  constructor(
    @InjectRepository(VoucherGiftLogEntity)
    private readonly repo: Repository<VoucherGiftLogEntity>,
  ) {}

  async findAll(
    query: QueryGiftedVoucherLogDto,
    sellerId: number | null,
  ): Promise<{ data: GiftedVoucherLog[]; totalCount: number }> {
    const skipNum = Number(query.skip);
    const takeNum = Number(query.take);
    const skip = Number.isFinite(skipNum) && skipNum >= 0 ? skipNum : 0;
    const take = Number.isFinite(takeNum) && takeNum > 0 ? takeNum : 20;

    const qb: SelectQueryBuilder<VoucherGiftLogEntity> = this.repo
      .createQueryBuilder('log')
      .leftJoinAndSelect('log.gifted_by', 'gifted_by')
      .leftJoinAndSelect('log.gifted_to', 'gifted_to');

    if (sellerId !== null) {
      qb.andWhere('log.seller_id = :sellerId', { sellerId });
    }

    if (query.source !== undefined) {
      if (query.source === 'admin') {
        qb.andWhere('log.seller_id IS NULL');
      } else {
        const sourceId = Number(query.source);
        if (Number.isFinite(sourceId) && sourceId > 0) {
          qb.andWhere('log.seller_id = :sourceId', { sourceId });
        }
      }
    }

    if (query.eligible_seller_id !== undefined) {
      // Find voucher IDs whose eligible items are owned by this seller.
      // Each voucher has one scope — follow the appropriate chain to seller_id.
      qb.andWhere(
        `log.voucher_id IN (
          SELECT vs.voucher_id FROM voucher_services vs
            INNER JOIN services s ON s.id = vs.service_id
            WHERE s.seller_id = :eligibleSellerId
          UNION
          SELECT vp.voucher_id FROM voucher_products vp
            INNER JOIN products p ON p.id = vp.product_id
            WHERE p.seller_id = :eligibleSellerId
          UNION
          SELECT vsc.voucher_id FROM voucher_service_categories vsc
            INNER JOIN services s2 ON s2.category_id = vsc.service_category_id
            WHERE s2.seller_id = :eligibleSellerId
          UNION
          SELECT vc.voucher_id FROM voucher_categories vc
            INNER JOIN product_categories pc ON pc.category_id = vc.category_id
            INNER JOIN products p2 ON p2.id = pc.product_id
            WHERE p2.seller_id = :eligibleSellerId
        )`,
        { eligibleSellerId: query.eligible_seller_id },
      );
    }

    if (query.voucher_id !== undefined) {
      qb.andWhere('log.voucher_id = :voucherId', {
        voucherId: query.voucher_id,
      });
    }
    if (query.gifted_by_user_id !== undefined) {
      qb.andWhere('log.gifted_by_user_id = :giftedByUserId', {
        giftedByUserId: query.gifted_by_user_id,
      });
    }
    if (query.gifted_to_user_id !== undefined) {
      qb.andWhere('log.gifted_to_user_id = :giftedToUserId', {
        giftedToUserId: query.gifted_to_user_id,
      });
    }
    if (query.date_from) {
      qb.andWhere('log.created_at >= :dateFrom', { dateFrom: query.date_from });
    }
    if (query.date_to) {
      qb.andWhere('log.created_at <= :dateTo', { dateTo: query.date_to });
    }

    const sortField = query.sortField ?? 'gifted_at';
    const sortBy = query.sortBy ?? 'DESC';
    const dbSortField = sortField === 'gifted_at' ? 'created_at' : sortField;
    qb.orderBy(`log.${dbSortField}`, sortBy);

    qb.skip(skip).take(take);

    const [entities, totalCount] = await qb.getManyAndCount();

    return {
      data: entities.map((e) => GiftedVoucherLogMapper.toDomain(e)),
      totalCount,
    };
  }

  async findById(
    id: number,
    sellerId?: number | null,
  ): Promise<GiftedVoucherLog | null> {
    const qb = this.repo
      .createQueryBuilder('log')
      .leftJoinAndSelect('log.gifted_by', 'gifted_by')
      .leftJoinAndSelect('log.gifted_to', 'gifted_to')
      .where('log.id = :id', { id });

    if (sellerId != null) {
      qb.andWhere('log.seller_id = :sellerId', { sellerId });
    }

    const entity = await qb.getOne();
    if (!entity) return null;
    return GiftedVoucherLogMapper.toDomain(entity);
  }
}
