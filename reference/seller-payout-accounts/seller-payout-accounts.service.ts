import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseSellerPayoutAccountRepository } from './persistence/base-seller-payout-account.repository';
import { SellerPayoutAccount } from './domain/seller-payout-account';
import { CreateSellerPayoutAccountDto } from './dto/create-seller-payout-account.dto';
import { UpdateSellerPayoutAccountDto } from './dto/update-seller-payout-account.dto';
import { QuerySellerPayoutAccountDto } from './dto/query-seller-payout-account.dto';
import { User } from '@/users/domain/user';
import { IPaginatedResult } from '@/utils/types/paginated-result';
import { IPaginationOptions } from '@/utils/types/pagination-options';
import { SellerEntity } from '@/sellers/persistence/entities/seller.entity';

@Injectable()
export class SellerPayoutAccountsService {
  constructor(
    private readonly repository: BaseSellerPayoutAccountRepository,
    @InjectRepository(SellerEntity)
    private readonly sellerRepository: Repository<SellerEntity>,
  ) {}

  /**
   * Validate that the user has access to seller resources.
   * System admins can access all resources.
   * Sellers can only access their own resources.
   */
  private async validateSellerAccess(
    sellerId: number,
    user: User,
  ): Promise<void> {
    if (user.system_admin) return;

    const seller = await this.sellerRepository.findOne({
      where: { id: sellerId, user_id: user.id },
    });

    if (!seller) {
      throw new ForbiddenException(
        'You can only access your own payout account information',
      );
    }
  }

  /**
   * Create a new seller payout account.
   */
  async create(
    input: CreateSellerPayoutAccountDto,
    user: User,
  ): Promise<SellerPayoutAccount> {
    // If setting as default, unset other default accounts
    if (input.is_default) {
      await this.unsetDefaultAccounts(input.seller_id);
    }

    const account = new SellerPayoutAccount();
    account.seller_id = input.seller_id;
    account.account_type = input.account_type;
    account.account_name = input.account_name;
    account.account_number = input.account_number;
    account.bank_name = input.bank_name || null;
    account.bank_code = input.bank_code || null;
    account.bank_branch = input.bank_branch || null;
    account.swift_code = input.swift_code || null;
    account.mobile_number = input.mobile_number || null;
    account.is_default = input.is_default || false;
    account.is_verified = false;
    account.verified_at = null;
    account.status = input.status || 'active';
    account.created_by = user as any;

    return this.repository.create(account);
  }

  /**
   * Unset default flag for all accounts of a seller.
   */
  private async unsetDefaultAccounts(sellerId: number): Promise<void> {
    const accounts = await this.repository.findBySellerId(sellerId);
    for (const account of accounts) {
      if (account.is_default) {
        await this.repository.update(account.id, { is_default: false });
      }
    }
  }

  /**
   * Find all seller payout accounts with pagination.
   * Non-admin users can only see their own accounts.
   */
  async findAll(
    query: QuerySellerPayoutAccountDto,
    user: User,
  ): Promise<IPaginatedResult<SellerPayoutAccount>> {
    const paginationOptions: IPaginationOptions = {
      page: query.page || 1,
      limit: query.limit || 10,
    };

    const filterQuery: any = {};

    // Non-admin users can only see their own accounts
    if (!user.system_admin) {
      const seller = await this.sellerRepository.findOne({
        where: { user_id: user.id },
      });
      if (!seller) {
        throw new ForbiddenException(
          'You must be a seller to view payout accounts',
        );
      }
      filterQuery.seller_id = seller.id;
    } else if (query.seller_id) {
      // Admins can filter by seller_id if provided
      filterQuery.seller_id = query.seller_id;
    }

    if (query.account_type) {
      filterQuery.account_type = query.account_type;
    }
    if (query.is_default !== undefined) {
      filterQuery.is_default = query.is_default;
    }
    if (query.status) {
      filterQuery.status = query.status;
    }

    return this.repository.findAllWithPagination({
      filterQuery,
      paginationOptions,
    });
  }

  /**
   * Find a seller payout account by ID.
   */
  async findById(id: number, user: User): Promise<SellerPayoutAccount> {
    const account = await this.repository.findById(id);
    if (!account) {
      throw new NotFoundException(
        `Seller payout account with ID ${id} not found`,
      );
    }

    await this.validateSellerAccess(account.seller_id, user);

    return account;
  }

  /**
   * Update a seller payout account.
   */
  async update(
    id: number,
    input: UpdateSellerPayoutAccountDto,
    user: User,
  ): Promise<SellerPayoutAccount> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundException(
        `Seller payout account with ID ${id} not found`,
      );
    }

    await this.validateSellerAccess(existing.seller_id, user);

    // If setting as default, unset other default accounts
    if (input.is_default && !existing.is_default) {
      await this.unsetDefaultAccounts(existing.seller_id);
    }

    return this.repository.update(id, {
      ...input,
      updated_by: user as any,
    });
  }

  /**
   * Find accounts by seller ID.
   */
  async findBySellerId(
    sellerId: number,
    user: User,
  ): Promise<SellerPayoutAccount[]> {
    await this.validateSellerAccess(sellerId, user);
    return this.repository.findBySellerId(sellerId);
  }

  /**
   * Get default account for a seller.
   */
  async getDefaultAccount(
    sellerId: number,
    user: User,
  ): Promise<SellerPayoutAccount | null> {
    await this.validateSellerAccess(sellerId, user);
    return this.repository.findDefaultBySellerId(sellerId);
  }
}
