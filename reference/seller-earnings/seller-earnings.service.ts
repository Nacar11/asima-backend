import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { BaseSellerEarningRepository } from './persistence/base-seller-earning.repository';
import { SellerEarning } from './domain/seller-earning';
import { CreateSellerEarningDto } from './dto/create-seller-earning.dto';
import { UpdateSellerEarningDto } from './dto/update-seller-earning.dto';
import { QuerySellerEarningDto } from './dto/query-seller-earning.dto';
import { User } from '@/users/domain/user';
import { EarningsStatusEnum } from './enums/earnings-status.enum';
import { IPaginatedResult } from '@/utils/types/paginated-result';
import { IPaginationOptions } from '@/utils/types/pagination-options';

/**
 * Seller Earnings Service.
 *
 * Handles business logic for seller earnings. Manages earnings tracking,
 * calculations, and status updates for seller payouts.
 *
 * @version 1
 * @since 1.0.0
 */
@Injectable()
export class SellerEarningsService {
  constructor(private readonly repository: BaseSellerEarningRepository) {}

  /**
   * Record an earning when escrow releases to provider.
   *
   * Called when a milestone is approved and escrow releases funds.
   * Creates an earning record for the seller.
   *
   * @param sellerId - Seller ID
   * @param input - Create earning DTO
   * @param user - Current authenticated user
   * @returns Created seller earning
   */
  async recordEarning(
    sellerId: number,
    input: CreateSellerEarningDto,
    user: User,
  ): Promise<SellerEarning> {
    // Validate net amount is positive
    if (input.net_amount <= 0) {
      throw new BadRequestException('Net amount must be greater than 0');
    }

    // Validate gross amount >= net amount + platform fee
    const calculatedNet = input.gross_amount - (input.platform_fee || 0);
    if (Math.abs(calculatedNet - input.net_amount) > 0.01) {
      throw new BadRequestException(
        'Net amount must equal gross amount minus platform fee',
      );
    }

    const earning = new SellerEarning();
    earning.seller_id = sellerId;
    earning.source_type = input.source_type;
    earning.source_id = input.source_id;
    earning.milestone_id = input.milestone_id || null;
    earning.gross_amount = input.gross_amount;
    earning.platform_fee = input.platform_fee || 0;
    earning.net_amount = input.net_amount;
    earning.currency_id = input.currency_id || null;
    earning.status =
      (input.status as EarningsStatusEnum) || EarningsStatusEnum.PENDING;
    earning.available_at = input.available_at || null;
    earning.created_by = user as any;

    return this.repository.create(earning);
  }

  /**
   * Create a new seller earning (standard CRUD).
   *
   * @param input - Create earning DTO
   * @param user - Current authenticated user
   * @returns Created seller earning
   */
  async create(
    input: CreateSellerEarningDto,
    user: User,
  ): Promise<SellerEarning> {
    return this.recordEarning(input.seller_id, input, user);
  }

  /**
   * Find all seller earnings with pagination.
   *
   * @param query - Query parameters
   * @returns Paginated seller earnings
   */
  async findAll(
    query: QuerySellerEarningDto,
  ): Promise<IPaginatedResult<SellerEarning>> {
    const paginationOptions: IPaginationOptions = {
      page: query.page || 1,
      limit: query.limit || 10,
    };

    const filterQuery: any = {};
    if (query.seller_id) {
      filterQuery.seller_id = query.seller_id;
    }
    if (query.source_type) {
      filterQuery.source_type = query.source_type;
    }
    if (query.source_id) {
      filterQuery.source_id = query.source_id;
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
   * Find a seller earning by ID.
   *
   * @param id - Earning ID
   * @param user - Current authenticated user
   * @returns Seller earning if found
   */
  async findById(id: number): Promise<SellerEarning> {
    const earning = await this.repository.findById(id);
    if (!earning) {
      throw new NotFoundException(`Seller earning with ID ${id} not found`);
    }

    // TODO: Add authorization check (seller can only see their own earnings)

    return earning;
  }

  /**
   * Update a seller earning.
   *
   * @param id - Earning ID
   * @param input - Update earning DTO
   * @param user - Current authenticated user
   * @returns Updated seller earning
   */
  async update(
    id: number,
    input: UpdateSellerEarningDto,
    user: User,
  ): Promise<SellerEarning> {
    const existing = await this.findById(id);

    // Validate net amount if provided
    if (input.net_amount !== undefined) {
      const grossAmount = input.gross_amount ?? existing.gross_amount;
      const platformFee = input.platform_fee ?? existing.platform_fee;
      const calculatedNet = grossAmount - platformFee;
      if (Math.abs(calculatedNet - input.net_amount) > 0.01) {
        throw new BadRequestException(
          'Net amount must equal gross amount minus platform fee',
        );
      }
    }

    const updatePayload: Partial<SellerEarning> = {
      updated_by: user as any,
    };

    // Only include fields that are provided
    if (input.seller_id !== undefined)
      updatePayload.seller_id = input.seller_id;
    if (input.source_type !== undefined)
      updatePayload.source_type = input.source_type;
    if (input.source_id !== undefined)
      updatePayload.source_id = input.source_id;
    if (input.milestone_id !== undefined)
      updatePayload.milestone_id = input.milestone_id;
    if (input.gross_amount !== undefined)
      updatePayload.gross_amount = input.gross_amount;
    if (input.platform_fee !== undefined)
      updatePayload.platform_fee = input.platform_fee;
    if (input.net_amount !== undefined)
      updatePayload.net_amount = input.net_amount;
    if (input.currency_id !== undefined)
      updatePayload.currency_id = input.currency_id;
    if (input.status !== undefined)
      updatePayload.status = input.status as EarningsStatusEnum;
    if (input.available_at !== undefined)
      updatePayload.available_at = input.available_at;

    return this.repository.update(id, updatePayload);
  }

  /**
   * Calculate pending earnings for a seller.
   *
   * @param sellerId - Seller ID
   * @returns Total pending earnings amount
   */
  async calculatePendingEarnings(sellerId: number): Promise<number> {
    return this.repository.calculatePendingEarnings(sellerId);
  }

  /**
   * Calculate available balance for a seller.
   *
   * @param sellerId - Seller ID
   * @returns Total available earnings amount
   */
  async calculateAvailableBalance(sellerId: number): Promise<number> {
    return this.repository.calculateAvailableEarnings(sellerId);
  }

  /**
   * Get earnings summary for a seller.
   *
   * @param sellerId - Seller ID
   * @returns Earnings summary with pending and available amounts
   */
  async getEarningsSummary(sellerId: number): Promise<{
    pending: number;
    available: number;
    total: number;
  }> {
    const [pending, available] = await Promise.all([
      this.calculatePendingEarnings(sellerId),
      this.calculateAvailableBalance(sellerId),
    ]);

    return {
      pending,
      available,
      total: pending + available,
    };
  }

  /**
   * Get enhanced earnings summary with monthly breakdowns and chart data.
   *
   * @param sellerId - Seller ID
   * @returns Enhanced earnings summary
   */
  async getEnhancedEarningsSummary(sellerId: number): Promise<{
    total_earnings: number;
    available_balance: number;
    pending_balance: number;
    this_month_earnings: number;
    last_month_earnings: number;
    chart: Array<{ period: string; amount: number }>;
  }> {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const lastMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const lastMonthYear = currentMonth === 1 ? currentYear - 1 : currentYear;

    // Calculate last 30 days for chart
    const chartEndDate = new Date(now);
    const chartStartDate = new Date(now);
    chartStartDate.setDate(chartStartDate.getDate() - 30);
    const chartStartDateStr = chartStartDate.toISOString().split('T')[0];
    const chartEndDateStr = chartEndDate.toISOString().split('T')[0];

    const [
      pending,
      available,
      thisMonthEarnings,
      lastMonthEarnings,
      chartData,
    ] = await Promise.all([
      this.calculatePendingEarnings(sellerId),
      this.calculateAvailableBalance(sellerId),
      this.repository.calculateMonthlyEarnings(
        sellerId,
        currentYear,
        currentMonth,
      ),
      this.repository.calculateMonthlyEarnings(
        sellerId,
        lastMonthYear,
        lastMonth,
      ),
      this.repository.getEarningsByDateRange(
        sellerId,
        chartStartDateStr,
        chartEndDateStr,
      ),
    ]);

    // Format chart data
    const chart = chartData.map((item) => ({
      period: item.date,
      amount: item.amount,
    }));

    return {
      total_earnings: pending + available,
      available_balance: available,
      pending_balance: pending,
      this_month_earnings: thisMonthEarnings,
      last_month_earnings: lastMonthEarnings,
      chart,
    };
  }

  /**
   * Find earnings by seller ID.
   *
   * @param sellerId - Seller ID
   * @param status - Optional status filter
   * @returns Array of seller earnings
   */
  async findBySellerId(
    sellerId: number,
    status?: string,
  ): Promise<SellerEarning[]> {
    return this.repository.findBySellerId(sellerId, status);
  }
}
