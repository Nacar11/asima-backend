import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { WalletEntity } from '@/wallets/persistence/entities/wallet.entity';
import { WalletMapper } from '@/wallets/persistence/mappers/wallet.mapper';
import { Wallet } from '@/wallets/domain/wallet';
import { AdminWalletListItem } from '@/wallets/domain/admin-wallet-list-item';
import { WalletTypeEnum } from '@/wallets/enums/wallet-type.enum';
import { WalletStatusEnum } from '@/wallets/enums/wallet-status.enum';

@Injectable()
export class WalletRepository {
  constructor(
    @InjectRepository(WalletEntity)
    private readonly repo: Repository<WalletEntity>,
  ) {}

  async findBySellerIdWithLock(
    sellerId: number,
    manager: EntityManager,
  ): Promise<WalletEntity | null> {
    return manager
      .getRepository(WalletEntity)
      .createQueryBuilder('w')
      .where('w.seller_id = :sellerId AND w.wallet_type = :type', {
        sellerId,
        type: WalletTypeEnum.SELLER,
      })
      .setLock('pessimistic_write')
      .getOne();
  }

  async findByUserId(userId: number): Promise<Wallet | null> {
    const entity = await this.repo.findOne({
      where: { user_id: userId, wallet_type: WalletTypeEnum.SELLER },
    });
    return entity ? WalletMapper.toDomain(entity) : null;
  }

  async findById(id: number): Promise<Wallet | null> {
    const entity = await this.repo.findOne({ where: { id } });
    return entity ? WalletMapper.toDomain(entity) : null;
  }

  async findAll(filters: {
    status?: string;
    seller_id?: number;
    seller_name?: string;
    page?: number;
    limit?: number;
  }): Promise<[Wallet[], number]> {
    const qb = this.repo.createQueryBuilder('w');
    // Always restrict to seller wallets; platform wallet is accessed via findAdminWallet()
    qb.andWhere('w.wallet_type = :type', { type: WalletTypeEnum.SELLER });
    if (filters.status) {
      qb.andWhere('w.status = :status', { status: filters.status });
    }
    if (filters.seller_id) {
      qb.andWhere('w.seller_id = :sid', { sid: filters.seller_id });
    }
    if (filters.seller_name) {
      qb.innerJoin('sellers', 's', 's.id = w.seller_id').andWhere(
        's.store_name ILIKE :name',
        {
          name: `%${filters.seller_name}%`,
        },
      );
    }
    qb.skip(((filters.page ?? 1) - 1) * (filters.limit ?? 20))
      .take(filters.limit ?? 20)
      .orderBy('w.created_at', 'DESC');
    const [entities, count] = await qb.getManyAndCount();
    return [entities.map(WalletMapper.toDomain), count];
  }

  async findAdminWallet(): Promise<Wallet | null> {
    const entity = await this.repo.findOne({
      where: { wallet_type: WalletTypeEnum.ADMIN },
    });
    return entity ? WalletMapper.toDomain(entity) : null;
  }

  async findAdminWalletWithLock(
    manager: EntityManager,
  ): Promise<WalletEntity | null> {
    return manager
      .getRepository(WalletEntity)
      .createQueryBuilder('w')
      .where('w.wallet_type = :type', { type: WalletTypeEnum.ADMIN })
      .setLock('pessimistic_write')
      .getOne();
  }

  async createAdminWalletIfNotExists(systemUserId: number): Promise<void> {
    await this.repo
      .createQueryBuilder()
      .insert()
      .into(WalletEntity)
      .values({
        user_id: systemUserId,
        seller_id: null,
        wallet_type: WalletTypeEnum.ADMIN,
      })
      .orIgnore()
      .execute();
  }

  async updateStatus(
    id: number,
    status: WalletStatusEnum,
    frozenReason: string | null,
  ): Promise<void> {
    await this.repo.update(id, {
      status,
      frozen_reason: frozenReason,
    });
  }

  async findAllForAdmin(filters: {
    status?: string;
    seller_name?: string;
    page?: number;
    limit?: number;
  }): Promise<[AdminWalletListItem[], number]> {
    const qb = this.repo
      .createQueryBuilder('w')
      .leftJoin('w.seller', 's')
      .leftJoin('s.user', 'u')
      .addSelect(['s.id', 's.store_name', 's.user_id'])
      .addSelect(['u.first_name', 'u.last_name', 'u.email'])
      .where('w.wallet_type = :type', { type: WalletTypeEnum.SELLER });

    if (filters.status) {
      qb.andWhere('w.status = :status', { status: filters.status });
    }
    if (filters.seller_name) {
      qb.andWhere('s.store_name ILIKE :name', {
        name: `%${filters.seller_name}%`,
      });
    }

    const page = Number(filters.page) || 1;
    const limit = Number(filters.limit) || 20;
    qb.skip((page - 1) * limit)
      .take(limit)
      .orderBy('w.created_at', 'DESC');

    const [entities, count] = await qb.getManyAndCount();
    return [entities.map(mapToAdminWalletListItem), count];
  }

  async findByIdForAdmin(id: number): Promise<AdminWalletListItem | null> {
    const entity = await this.repo
      .createQueryBuilder('w')
      .leftJoin('w.seller', 's')
      .leftJoin('s.user', 'u')
      .addSelect(['s.id', 's.store_name', 's.user_id'])
      .addSelect(['u.first_name', 'u.last_name', 'u.email'])
      .where('w.id = :id', { id })
      .getOne();

    return entity ? mapToAdminWalletListItem(entity) : null;
  }

  async createIfNotExists(userId: number, sellerId: number): Promise<void> {
    await this.repo
      .createQueryBuilder()
      .insert()
      .into(WalletEntity)
      .values({
        user_id: userId,
        seller_id: sellerId,
        wallet_type: WalletTypeEnum.SELLER,
      })
      .orIgnore()
      .execute();
  }
}

function mapToAdminWalletListItem(e: WalletEntity): AdminWalletListItem {
  const item = new AdminWalletListItem();
  item.id = e.id;
  item.balance = Number(e.balance);
  item.pending_balance = Number(e.pending_balance);
  item.total_credited = Number(e.total_credited);
  item.total_debited = Number(e.total_debited);
  item.debt_amount = Number(e.debt_amount);
  item.status = e.status;
  item.frozen_reason = e.frozen_reason;
  item.currency_code = e.currency_code;
  item.seller_id = e.seller_id;
  item.seller_store_name = (e.seller as any)?.store_name ?? null;
  item.owner_first_name = (e.seller as any)?.user?.first_name ?? null;
  item.owner_last_name = (e.seller as any)?.user?.last_name ?? null;
  item.owner_email = (e.seller as any)?.user?.email ?? null;
  item.created_at = e.created_at;
  return item;
}
