import { SellerPayoutAccount } from '@/seller-payout-accounts/domain/seller-payout-account';
import { BaseGetDto as GetQueryParams } from '@/devextreme/dto/base-get.dto';
import { DevExtremePaginatedResponseDto } from '@/devextreme/dto/paginated-response';
import { IPaginationOptions } from '@/utils/types/pagination-options';
import { IPaginatedResult } from '@/utils/types/paginated-result';

/**
 * Abstract repository interface for SellerPayoutAccount operations.
 *
 * @version 1
 * @since 1.0.0
 */
export abstract class BaseSellerPayoutAccountRepository {
  abstract create(account: SellerPayoutAccount): Promise<SellerPayoutAccount>;

  abstract findByMany(
    loadOptions: GetQueryParams,
  ): Promise<DevExtremePaginatedResponseDto<SellerPayoutAccount>>;

  abstract findAllWithPagination(options: {
    filterQuery?: any;
    paginationOptions: IPaginationOptions;
  }): Promise<IPaginatedResult<SellerPayoutAccount>>;

  abstract findById(id: number): Promise<SellerPayoutAccount | null>;

  abstract findBySellerId(sellerId: number): Promise<SellerPayoutAccount[]>;

  abstract findDefaultBySellerId(
    sellerId: number,
  ): Promise<SellerPayoutAccount | null>;

  abstract update(
    id: number,
    payload: Partial<SellerPayoutAccount>,
  ): Promise<SellerPayoutAccount>;
}
