import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { WalletWithdrawalEntity } from '@/wallets/persistence/entities/wallet-withdrawal.entity';
import { WalletWithdrawalMapper } from '@/wallets/persistence/mappers/wallet-withdrawal.mapper';
import { WalletWithdrawal } from '@/wallets/domain/wallet-withdrawal';
import { AdminWithdrawalListItem } from '@/wallets/domain/admin-withdrawal-list-item';
import { WithdrawalStatusEnum } from '@/wallets/enums/withdrawal-status.enum';

@Injectable()
export class WalletWithdrawalRepository {
  constructor(
    @InjectRepository(WalletWithdrawalEntity)
    private readonly repo: Repository<WalletWithdrawalEntity>,
  ) {}

  async create(
    data: Partial<WalletWithdrawalEntity>,
    manager: EntityManager,
  ): Promise<WalletWithdrawal> {
    const entity = manager.getRepository(WalletWithdrawalEntity).create(data);
    const saved = await manager
      .getRepository(WalletWithdrawalEntity)
      .save(entity);
    return WalletWithdrawalMapper.toDomain(saved);
  }

  async findByWalletId(
    walletId: number,
    filters: { status?: string; page?: number; limit?: number },
  ): Promise<[WalletWithdrawal[], number]> {
    const qb = this.repo
      .createQueryBuilder('w')
      .where('w.wallet_id = :walletId', { walletId });

    if (filters.status) {
      qb.andWhere('w.status = :status', { status: filters.status });
    }

    qb.skip(((filters.page ?? 1) - 1) * (filters.limit ?? 20))
      .take(filters.limit ?? 20)
      .orderBy('w.requested_at', 'DESC');

    const [entities, count] = await qb.getManyAndCount();
    return [entities.map(WalletWithdrawalMapper.toDomain), count];
  }

  async findById(id: number): Promise<WalletWithdrawal | null> {
    const entity = await this.repo.findOne({ where: { id } });
    return entity ? WalletWithdrawalMapper.toDomain(entity) : null;
  }

  async countTodayByWalletId(
    walletId: number,
    manager?: EntityManager,
  ): Promise<number> {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const repo = manager
      ? manager.getRepository(WalletWithdrawalEntity)
      : this.repo;
    return repo
      .createQueryBuilder('w')
      .where('w.wallet_id = :walletId', { walletId })
      .andWhere('w.requested_at >= :startOfDay', { startOfDay })
      .andWhere('w.status != :cancelled', {
        cancelled: WithdrawalStatusEnum.CANCELLED,
      })
      .getCount();
  }

  async sumTodayByWalletId(
    walletId: number,
    manager?: EntityManager,
  ): Promise<number> {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const repo = manager
      ? manager.getRepository(WalletWithdrawalEntity)
      : this.repo;
    const result = await repo
      .createQueryBuilder('w')
      .select('COALESCE(SUM(w.amount), 0)', 'total')
      .where('w.wallet_id = :walletId', { walletId })
      .andWhere('w.requested_at >= :startOfDay', { startOfDay })
      .andWhere('w.status != :cancelled', {
        cancelled: WithdrawalStatusEnum.CANCELLED,
      })
      .getRawOne();
    return Number(result?.total ?? 0);
  }

  async findAll(filters: {
    status?: string;
    date_from?: string;
    date_to?: string;
    page?: number;
    limit?: number;
  }): Promise<[WalletWithdrawal[], number]> {
    const qb = this.repo.createQueryBuilder('w');
    if (filters.status) {
      qb.andWhere('w.status = :status', { status: filters.status });
    }
    if (filters.date_from) {
      qb.andWhere('w.requested_at >= :dateFrom', {
        dateFrom: new Date(filters.date_from),
      });
    }
    if (filters.date_to) {
      qb.andWhere('w.requested_at <= :dateTo', {
        dateTo: new Date(filters.date_to + 'T23:59:59.999Z'),
      });
    }
    const page = Number(filters.page) || 1;
    const limit = Number(filters.limit) || 20;
    qb.skip((page - 1) * limit)
      .take(limit)
      .orderBy('w.requested_at', 'DESC');
    const [entities, count] = await qb.getManyAndCount();
    return [entities.map(WalletWithdrawalMapper.toDomain), count];
  }

  async findAllForAdmin(filters: {
    status?: string;
    wallet_id?: number;
    seller_name?: string;
    date_from?: string;
    date_to?: string;
    page?: number;
    limit?: number;
  }): Promise<[AdminWithdrawalListItem[], number]> {
    const qb = this.repo
      .createQueryBuilder('w')
      .leftJoin('w.bank_account', 'ba')
      .leftJoin('ba.bank', 'bank')
      .leftJoin('w.wallet', 'wallet')
      .leftJoin('wallet.seller', 's')
      .leftJoin('s.user', 'u')
      .addSelect([
        'ba.id',
        'ba.account_holder_name',
        'ba.last_four',
        'ba.account_type',
      ])
      .addSelect(['bank.bank_name', 'bank.bank_code'])
      .addSelect(['wallet.id', 'wallet.seller_id'])
      .addSelect(['s.id', 's.store_name', 's.user_id'])
      .addSelect(['u.first_name', 'u.last_name', 'u.email']);

    if (filters.status) {
      qb.andWhere('w.status = :status', { status: filters.status });
    }
    if (filters.wallet_id) {
      qb.andWhere('w.wallet_id = :walletId', { walletId: filters.wallet_id });
    }
    if (filters.seller_name) {
      qb.andWhere('s.store_name ILIKE :sellerName', {
        sellerName: `%${filters.seller_name}%`,
      });
    }
    if (filters.date_from) {
      qb.andWhere('w.requested_at >= :dateFrom', {
        dateFrom: new Date(filters.date_from),
      });
    }
    if (filters.date_to) {
      qb.andWhere('w.requested_at <= :dateTo', {
        dateTo: new Date(filters.date_to + 'T23:59:59.999Z'),
      });
    }

    const page = Number(filters.page) || 1;
    const limit = Number(filters.limit) || 20;
    qb.skip((page - 1) * limit)
      .take(limit)
      .orderBy('w.requested_at', 'DESC');

    const [entities, count] = await qb.getManyAndCount();
    return [entities.map(mapToAdminWithdrawalListItem), count];
  }

  async findOneForAdmin(id: number): Promise<AdminWithdrawalListItem | null> {
    const qb = this.repo
      .createQueryBuilder('w')
      .leftJoin('w.bank_account', 'ba')
      .leftJoin('ba.bank', 'bank')
      .leftJoin('w.wallet', 'wallet')
      .leftJoin('wallet.seller', 's')
      .leftJoin('s.user', 'u')
      .addSelect([
        'ba.id',
        'ba.account_holder_name',
        'ba.last_four',
        'ba.account_type',
      ])
      .addSelect(['bank.bank_name', 'bank.bank_code'])
      .addSelect(['wallet.id', 'wallet.seller_id'])
      .addSelect(['s.id', 's.store_name', 's.user_id'])
      .addSelect(['u.first_name', 'u.last_name', 'u.email'])
      .where('w.id = :id', { id });

    const entity = await qb.getOne();
    return entity ? mapToAdminWithdrawalListItem(entity) : null;
  }

  async findByPayoutReference(
    reference: string,
  ): Promise<WalletWithdrawal | null> {
    const entity = await this.repo.findOne({
      where: { payout_reference: reference },
    });
    return entity ? WalletWithdrawalMapper.toDomain(entity) : null;
  }

  async updateStatus(
    id: number,
    status: WithdrawalStatusEnum,
    extra?: Partial<WalletWithdrawalEntity>,
    manager?: EntityManager,
  ): Promise<void> {
    const repo = manager
      ? manager.getRepository(WalletWithdrawalEntity)
      : this.repo;
    await repo.update(id, { status, ...extra });
  }
}

function mapToAdminWithdrawalListItem(
  e: WalletWithdrawalEntity,
): AdminWithdrawalListItem {
  const ba = e.bank_account as any;
  const seller = (e.wallet as any)?.seller;
  const user = seller?.user;

  const item = new AdminWithdrawalListItem();
  item.id = e.id;
  item.wallet_id = e.wallet_id;
  item.amount = Number(e.amount);
  item.processing_fee = Number(e.processing_fee);
  item.net_amount = Number(e.net_amount);
  item.status = e.status;
  item.failure_reason = e.failure_reason;
  item.bank_reference_number = e.bank_reference_number;
  item.requested_at = e.requested_at;
  item.processed_at = e.processed_at;
  item.completed_at = e.completed_at;
  item.bank_account_id = e.bank_account_id;
  // Nested structure to match frontend AdminWithdrawal type
  item.bank_account = ba
    ? {
        id: ba.id,
        account_holder_name: ba.account_holder_name ?? null,
        last_four: ba.last_four ?? null,
        account_type: ba.account_type ?? null,
        bank: ba.bank
          ? { bank_name: ba.bank.bank_name, bank_code: ba.bank.bank_code }
          : undefined,
      }
    : null;
  item.seller = seller
    ? {
        id: seller.id,
        store_name: seller.store_name ?? null,
        user: user
          ? {
              first_name: user.first_name,
              last_name: user.last_name,
              email: user.email,
            }
          : undefined,
      }
    : null;
  return item;
}
