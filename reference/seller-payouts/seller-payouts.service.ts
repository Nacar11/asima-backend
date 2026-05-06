import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseSellerPayoutRepository } from './persistence/base-seller-payout.repository';
import { SellerPayout } from './domain/seller-payout';
import { CreateSellerPayoutDto } from './dto/create-seller-payout.dto';
import { UpdateSellerPayoutDto } from './dto/update-seller-payout.dto';
import { QuerySellerPayoutDto } from './dto/query-seller-payout.dto';
import { User } from '@/users/domain/user';
import { PayoutStatusEnum } from './enums/payout-status.enum';
import { IPaginatedResult } from '@/utils/types/paginated-result';
import { IPaginationOptions } from '@/utils/types/pagination-options';
import { SellerEntity } from '@/sellers/persistence/entities/seller.entity';
import { NotificationsService } from '@/notifications/notifications.service';
import { NotificationTypeEnum } from '@/notifications/enums/notification-type.enum';
import { SellersService } from '@/sellers/sellers.service';

@Injectable()
export class SellerPayoutsService {
  constructor(
    private readonly repository: BaseSellerPayoutRepository,
    private readonly notificationsService: NotificationsService,
    private readonly sellersService: SellersService,
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
        'You can only access your own payout information',
      );
    }
  }

  /**
   * Generate payout number: PO-YYYYMMDD-XXXX
   */
  private generatePayoutNumber(): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}${month}${day}`;
    const random = Math.floor(1000 + Math.random() * 9000);
    return `PO-${dateStr}-${random}`;
  }

  /**
   * Request a payout for a seller.
   */
  async requestPayout(
    sellerId: number,
    input: CreateSellerPayoutDto,
    user: User,
  ): Promise<SellerPayout> {
    // Validate amount
    if (input.amount <= 0) {
      throw new BadRequestException('Payout amount must be greater than 0');
    }

    // Generate payout number
    const payoutNumber = this.generatePayoutNumber();

    // Check if payout number already exists (unlikely but check anyway)
    const existing = await this.repository.findByPayoutNumber(payoutNumber);
    if (existing) {
      // Retry with new number
      return this.requestPayout(sellerId, input, user);
    }

    const payout = new SellerPayout();
    payout.seller_id = sellerId;
    payout.payout_number = payoutNumber;
    payout.amount = input.amount;
    payout.currency_id = input.currency_id || null;
    payout.payout_method = input.payout_method;
    payout.bank_name = input.bank_name || null;
    payout.account_number = input.account_number || null;
    payout.account_name = input.account_name || null;
    payout.status = PayoutStatusEnum.PENDING;
    payout.processed_at = null;
    payout.failure_reason = null;
    payout.created_by = user as any;

    return this.repository.create(payout);
  }

  /**
   * Create a new seller payout (standard CRUD).
   */
  async create(
    input: CreateSellerPayoutDto,
    user: User,
  ): Promise<SellerPayout> {
    return this.requestPayout(input.seller_id, input, user);
  }

  /**
   * Find all seller payouts with pagination.
   * Non-admin users can only see their own payouts.
   */
  async findAll(
    query: QuerySellerPayoutDto,
    user: User,
  ): Promise<IPaginatedResult<SellerPayout>> {
    const paginationOptions: IPaginationOptions = {
      page: query.page || 1,
      limit: query.limit || 10,
    };

    const filterQuery: any = {};

    // Non-admin users can only see their own payouts
    if (!user.system_admin) {
      const seller = await this.sellerRepository.findOne({
        where: { user_id: user.id },
      });
      if (!seller) {
        throw new ForbiddenException('You must be a seller to view payouts');
      }
      filterQuery.seller_id = seller.id;
    } else if (query.seller_id) {
      // Admins can filter by seller_id if provided
      filterQuery.seller_id = query.seller_id;
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
   * Find a seller payout by ID.
   */
  async findById(id: number, user: User): Promise<SellerPayout> {
    const payout = await this.repository.findById(id);
    if (!payout) {
      throw new NotFoundException(`Seller payout with ID ${id} not found`);
    }

    await this.validateSellerAccess(payout.seller_id, user);

    return payout;
  }

  /**
   * Update a seller payout.
   */
  async update(
    id: number,
    input: UpdateSellerPayoutDto,
    user: User,
  ): Promise<SellerPayout> {
    const payout = await this.repository.findById(id);
    if (!payout) {
      throw new NotFoundException(`Seller payout with ID ${id} not found`);
    }

    await this.validateSellerAccess(payout.seller_id, user);

    const updatePayload: Partial<SellerPayout> = {
      ...input,
      updated_by: user as any,
    };

    return this.repository.update(id, updatePayload);
  }

  /**
   * Process a payout (mark as processing/completed/failed).
   */
  async processPayout(
    id: number,
    status: PayoutStatusEnum,
    failureReason?: string,
    user?: User,
  ): Promise<SellerPayout> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundException(`Seller payout with ID ${id} not found`);
    }

    const updatePayload: Partial<SellerPayout> = {
      status,
      processed_at:
        status === PayoutStatusEnum.COMPLETED ||
        status === PayoutStatusEnum.FAILED
          ? new Date()
          : existing.processed_at,
      failure_reason: failureReason || null,
      updated_by: user as any,
    };

    const updated = await this.repository.update(id, updatePayload);

    // Send notification to seller based on payout status
    try {
      const seller = await this.sellersService.findById(existing.seller_id);
      if (seller.user_id) {
        if (status === PayoutStatusEnum.COMPLETED) {
          await this.notificationsService.notify(
            seller.user_id,
            NotificationTypeEnum.PAYOUT_COMPLETED,
            'Payout Completed!',
            `Your payout #${existing.payout_number} of ₱${existing.amount.toFixed(2)} has been successfully processed.`,
            'payout',
            updated.id,
            `/seller/payouts/${updated.id}`,
          );
        } else if (status === PayoutStatusEnum.FAILED) {
          await this.notificationsService.notify(
            seller.user_id,
            NotificationTypeEnum.PAYOUT_FAILED,
            'Payout Failed',
            `Your payout #${existing.payout_number} of ₱${existing.amount.toFixed(2)} has failed.${failureReason ? ` Reason: ${failureReason}` : ''}`,
            'payout',
            updated.id,
            `/seller/payouts/${updated.id}`,
          );
        }
      }
    } catch (error) {
      console.error('Failed to send payout status notification:', error);
    }

    return updated;
  }

  /**
   * Find payouts by seller ID.
   */
  async findBySellerId(sellerId: number, user: User): Promise<SellerPayout[]> {
    await this.validateSellerAccess(sellerId, user);
    return this.repository.findBySellerId(sellerId);
  }
}
