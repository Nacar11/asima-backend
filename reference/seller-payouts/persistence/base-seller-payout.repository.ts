import { SellerPayout } from '@/seller-payouts/domain/seller-payout';
import { BaseGetDto as GetQueryParams } from '@/devextreme/dto/base-get.dto';
import { DevExtremePaginatedResponseDto } from '@/devextreme/dto/paginated-response';
import { IPaginationOptions } from '@/utils/types/pagination-options';
import { IPaginatedResult } from '@/utils/types/paginated-result';

/**
 * Abstract repository interface for SellerPayout operations.
 *
 * @version 1
 * @since 1.0.0
 */
export abstract class BaseSellerPayoutRepository {
  abstract create(payout: SellerPayout): Promise<SellerPayout>;

  abstract findByMany(
    loadOptions: GetQueryParams,
  ): Promise<DevExtremePaginatedResponseDto<SellerPayout>>;

  abstract findAllWithPagination(options: {
    filterQuery?: any;
    paginationOptions: IPaginationOptions;
  }): Promise<IPaginatedResult<SellerPayout>>;

  abstract findById(id: number): Promise<SellerPayout | null>;

  abstract findBySellerId(sellerId: number): Promise<SellerPayout[]>;

  abstract findByPayoutNumber(
    payoutNumber: string,
  ): Promise<SellerPayout | null>;

  abstract update(
    id: number,
    payload: Partial<SellerPayout>,
  ): Promise<SellerPayout>;
}
