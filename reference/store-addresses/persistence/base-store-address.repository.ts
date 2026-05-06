import { StoreAddress } from '@/store-addresses/domain/store-address';

export abstract class BaseStoreAddressRepository {
  abstract findById(id: number): Promise<StoreAddress | null>;

  abstract findAllBySellerId(
    sellerId: number,
    skip?: number,
    take?: number,
  ): Promise<{ data: StoreAddress[]; total: number }>;

  abstract findDefaultBySellerId(
    sellerId: number,
  ): Promise<StoreAddress | null>;

  abstract create(data: Partial<StoreAddress>): Promise<StoreAddress>;

  abstract update(
    id: number,
    data: Partial<StoreAddress>,
  ): Promise<StoreAddress>;

  abstract softDelete(id: number, deletedBy: number): Promise<void>;

  abstract softDeleteAndPromoteDefault(
    id: number,
    sellerId: number,
    deletedBy: number,
  ): Promise<void>;

  abstract unsetDefaultForSeller(sellerId: number): Promise<void>;

  abstract setAsDefault(id: number, sellerId: number): Promise<StoreAddress>;
}
