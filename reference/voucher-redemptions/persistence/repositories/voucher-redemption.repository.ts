import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { BaseVoucherRedemptionRepository } from '@/voucher-redemptions/persistence/base-voucher-redemption.repository';
import { VoucherRedemptionEntity } from '@/voucher-redemptions/persistence/entities/voucher-redemption.entity';
import { VoucherRedemptionMapper } from '@/voucher-redemptions/persistence/mappers/voucher-redemption.mapper';
import { VoucherRedemption } from '@/voucher-redemptions/domain/voucher-redemption';
import { QueryVoucherRedemptionDto } from '@/voucher-redemptions/dto/query-voucher-redemption.dto';

@Injectable()
export class VoucherRedemptionRepository
  implements BaseVoucherRedemptionRepository
{
  constructor(
    @InjectRepository(VoucherRedemptionEntity)
    private readonly repo: Repository<VoucherRedemptionEntity>,
  ) {}

  async findAll(
    query: QueryVoucherRedemptionDto,
    sellerId: number | null,
  ): Promise<{ data: VoucherRedemption[]; totalCount: number }> {
    const skipNum = Number(query.skip);
    const takeNum = Number(query.take);
    const skip = Number.isFinite(skipNum) && skipNum >= 0 ? skipNum : 0;
    const take = Number.isFinite(takeNum) && takeNum > 0 ? takeNum : 20;

    const qb: SelectQueryBuilder<VoucherRedemptionEntity> = this.repo
      .createQueryBuilder('redemption')
      .leftJoinAndSelect('redemption.user_voucher', 'user_voucher')
      .leftJoinAndSelect('user_voucher.voucher', 'voucher')
      .leftJoinAndSelect('redemption.user', 'user')
      .leftJoinAndSelect('redemption.sales_order', 'sales_order')
      .leftJoinAndSelect('sales_order.seller', 'so_seller')
      .leftJoinAndSelect('sales_order.items', 'items')
      .leftJoinAndSelect('items.variant', 'variant')
      .leftJoinAndSelect('items.service', 'item_service')
      .leftJoinAndSelect('redemption.booking', 'booking')
      .leftJoinAndSelect('booking.service', 'b_service')
      .leftJoinAndSelect('booking.seller', 'b_seller')
      .leftJoinAndSelect('redemption.seller', 'r_seller');

    if (sellerId !== null) {
      qb.andWhere(
        '(sales_order.seller_id = :sellerId OR booking.seller_id = :sellerId OR redemption.seller_id = :sellerId)',
        { sellerId },
      );
    }

    if (query.user_voucher_id !== undefined) {
      qb.andWhere('redemption.user_voucher_id = :userVoucherId', {
        userVoucherId: query.user_voucher_id,
      });
    }
    if (query.user_id !== undefined) {
      qb.andWhere('redemption.user_id = :userId', {
        userId: query.user_id,
      });
    }
    if (query.sales_order_id !== undefined) {
      qb.andWhere('redemption.sales_order_id = :salesOrderId', {
        salesOrderId: query.sales_order_id,
      });
    }
    if (query.booking_id !== undefined) {
      qb.andWhere('redemption.booking_id = :bookingId', {
        bookingId: query.booking_id,
      });
    }
    if (query.seller_id !== undefined) {
      qb.andWhere(
        '(sales_order.seller_id = :sellerIdFilter OR booking.seller_id = :sellerIdFilter OR redemption.seller_id = :sellerIdFilter)',
        { sellerIdFilter: query.seller_id },
      );
    }
    if (query.search) {
      qb.andWhere(
        '(voucher.code ILIKE :search' +
          " OR CONCAT(user.first_name, ' ', user.last_name) ILIKE :search" +
          ' OR user.email ILIKE :search' +
          ' OR so_seller.store_name ILIKE :search' +
          ' OR b_seller.store_name ILIKE :search)',
        { search: `%${query.search}%` },
      );
    }
    if (query.channel === 'Online') {
      qb.andWhere('redemption.sales_order_id IS NOT NULL');
    } else if (query.channel === 'Onsite') {
      qb.andWhere(
        '(redemption.booking_id IS NOT NULL OR (redemption.sales_order_id IS NULL AND redemption.booking_id IS NULL))',
      );
    }
    if (query.date_from) {
      qb.andWhere('redemption.redeemed_at >= :dateFrom', {
        dateFrom: query.date_from,
      });
    }
    if (query.date_to) {
      qb.andWhere('redemption.redeemed_at <= :dateTo', {
        dateTo: query.date_to,
      });
    }

    const sortField = query.sortField ?? 'redeemed_at';
    const sortBy = query.sortBy ?? 'DESC';
    qb.orderBy(`redemption.${sortField}`, sortBy);

    qb.skip(skip).take(take);

    const [entities, totalCount] = await qb.getManyAndCount();

    return {
      data: entities.map((e) => VoucherRedemptionMapper.toDomain(e)),
      totalCount,
    };
  }

  async findById(
    id: number,
    sellerId?: number | null,
  ): Promise<VoucherRedemption | null> {
    const qb = this.repo
      .createQueryBuilder('redemption')
      .leftJoinAndSelect('redemption.user_voucher', 'user_voucher')
      .leftJoinAndSelect('user_voucher.voucher', 'voucher')
      .leftJoinAndSelect('redemption.user', 'user')
      .leftJoinAndSelect('redemption.sales_order', 'sales_order')
      .leftJoinAndSelect('sales_order.seller', 'so_seller')
      .leftJoinAndSelect('sales_order.items', 'items')
      .leftJoinAndSelect('items.variant', 'variant')
      .leftJoinAndSelect('items.service', 'item_service')
      .leftJoinAndSelect('redemption.booking', 'booking')
      .leftJoinAndSelect('booking.service', 'b_service')
      .leftJoinAndSelect('booking.seller', 'b_seller')
      .leftJoinAndSelect('redemption.seller', 'r_seller')
      .where('redemption.id = :id', { id });

    if (sellerId != null) {
      qb.andWhere(
        '(sales_order.seller_id = :sellerId OR booking.seller_id = :sellerId OR redemption.seller_id = :sellerId)',
        { sellerId },
      );
    }

    const entity = await qb.getOne();
    if (!entity) return null;
    return VoucherRedemptionMapper.toDomain(entity);
  }
}
