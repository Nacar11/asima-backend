import { UserAddress } from '@/user-addresses/domain/user-address';

export abstract class BaseUserAddressRepository {
  /**
   * Find address by ID
   */
  abstract findById(id: number): Promise<UserAddress | null>;

  /**
   * Find address by ID and user ID (ownership check)
   */
  abstract findByIdAndUserId(
    id: number,
    userId: number,
  ): Promise<UserAddress | null>;

  /**
   * Find all addresses for a user (excluding soft-deleted)
   */
  abstract findAllByUserId(userId: number): Promise<UserAddress[]>;

  /**
   * Find the default address for a user
   */
  abstract findDefaultByUserId(userId: number): Promise<UserAddress | null>;

  /**
   * Count addresses for a user (excluding soft-deleted)
   */
  abstract countByUserId(userId: number): Promise<number>;

  /**
   * Create a new address
   */
  abstract create(data: Partial<UserAddress>): Promise<UserAddress>;

  /**
   * Update an existing address
   */
  abstract update(id: number, data: Partial<UserAddress>): Promise<UserAddress>;

  /**
   * Soft delete an address
   */
  abstract softDelete(id: number, deletedBy: number): Promise<void>;

  /**
   * Unset default for all addresses of a user
   */
  abstract unsetDefaultForUser(userId: number): Promise<void>;

  /**
   * Set an address as default (also unsets previous default)
   */
  abstract setAsDefault(id: number, userId: number): Promise<UserAddress>;
}
