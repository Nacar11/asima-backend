import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { UserAddress } from '@/user-addresses/domain/user-address';
import { CreateUserAddressDto } from '@/user-addresses/dto/create-user-address.dto';
import { UpdateUserAddressDto } from '@/user-addresses/dto/update-user-address.dto';
import { BaseUserAddressRepository } from '@/user-addresses/persistence/base-user-address.repository';
import { User } from '@/users/domain/user';

/** Maximum number of addresses allowed per user */
const MAX_ADDRESSES_PER_USER = 10;

@Injectable()
export class UserAddressesService {
  constructor(
    private readonly userAddressRepository: BaseUserAddressRepository,
  ) {}

  /**
   * Create a new address for the current user
   */
  async create(
    createDto: CreateUserAddressDto,
    currentUser: User,
  ): Promise<UserAddress> {
    // Check address limit
    const addressCount = await this.userAddressRepository.countByUserId(
      currentUser.id,
    );
    if (addressCount >= MAX_ADDRESSES_PER_USER) {
      throw new UnprocessableEntityException({
        status: 422,
        errors: {
          addresses: `Maximum of ${MAX_ADDRESSES_PER_USER} addresses allowed per user`,
        },
      });
    }

    // If this is the first address or is_default is true, handle default logic
    const shouldBeDefault = addressCount === 0 || createDto.is_default === true;

    if (shouldBeDefault && addressCount > 0) {
      // Unset previous default
      await this.userAddressRepository.unsetDefaultForUser(currentUser.id);
    }

    const addressData: Partial<UserAddress> = {
      user_id: currentUser.id,
      label: createDto.label ?? 'Shipping',
      recipient_name: createDto.recipient_name,
      phone: createDto.phone ?? null,
      address_line1: createDto.address_line1,
      address_line2: createDto.address_line2 ?? null,
      city: createDto.city,
      state_province: createDto.state_province,
      postal_code: createDto.postal_code,
      country: createDto.country ?? 'Philippines',
      is_default: shouldBeDefault,
      latitude: createDto.latitude ?? null,
      longitude: createDto.longitude ?? null,
      created_by: {
        id: currentUser.id,
        first_name: currentUser.first_name,
        last_name: currentUser.last_name,
      },
      updated_by: {
        id: currentUser.id,
        first_name: currentUser.first_name,
        last_name: currentUser.last_name,
      },
    };

    return await this.userAddressRepository.create(addressData);
  }

  /**
   * Get all addresses for the current user
   */
  async findAll(currentUser: User): Promise<UserAddress[]> {
    return await this.userAddressRepository.findAllByUserId(currentUser.id);
  }

  /**
   * Get a specific address by ID (with ownership check)
   */
  async findOne(id: number, currentUser: User): Promise<UserAddress> {
    const address = await this.userAddressRepository.findByIdAndUserId(
      id,
      currentUser.id,
    );

    if (!address) {
      throw new NotFoundException(`Address with ID ${id} not found`);
    }

    return address;
  }

  /**
   * Get the default address for the current user
   */
  async findDefault(currentUser: User): Promise<UserAddress | null> {
    return await this.userAddressRepository.findDefaultByUserId(currentUser.id);
  }

  /**
   * Update an address (with ownership check)
   */
  async update(
    id: number,
    updateDto: UpdateUserAddressDto,
    currentUser: User,
  ): Promise<UserAddress> {
    // Verify ownership
    const existingAddress = await this.userAddressRepository.findByIdAndUserId(
      id,
      currentUser.id,
    );

    if (!existingAddress) {
      throw new NotFoundException(`Address with ID ${id} not found`);
    }

    // Handle default logic if is_default is being set to true
    if (updateDto.is_default === true && !existingAddress.is_default) {
      await this.userAddressRepository.unsetDefaultForUser(currentUser.id);
    }

    const updateData: Partial<UserAddress> = {
      ...updateDto,
      updated_by: {
        id: currentUser.id,
        first_name: currentUser.first_name,
        last_name: currentUser.last_name,
      },
    };

    return await this.userAddressRepository.update(id, updateData);
  }

  /**
   * Soft delete an address (with ownership check)
   */
  async remove(id: number, currentUser: User): Promise<void> {
    // Verify ownership
    const existingAddress = await this.userAddressRepository.findByIdAndUserId(
      id,
      currentUser.id,
    );

    if (!existingAddress) {
      throw new NotFoundException(`Address with ID ${id} not found`);
    }

    await this.userAddressRepository.softDelete(id, currentUser.id);

    // If we deleted the default address, promote another one
    if (existingAddress.is_default) {
      const remainingAddresses =
        await this.userAddressRepository.findAllByUserId(currentUser.id);
      if (remainingAddresses.length > 0) {
        await this.userAddressRepository.setAsDefault(
          remainingAddresses[0].id,
          currentUser.id,
        );
      }
    }
  }

  /**
   * Set an address as the default (with ownership check)
   */
  async setAsDefault(id: number, currentUser: User): Promise<UserAddress> {
    // Verify ownership
    const existingAddress = await this.userAddressRepository.findByIdAndUserId(
      id,
      currentUser.id,
    );

    if (!existingAddress) {
      throw new NotFoundException(`Address with ID ${id} not found`);
    }

    if (existingAddress.is_default) {
      // Already default, just return it
      return existingAddress;
    }

    return await this.userAddressRepository.setAsDefault(id, currentUser.id);
  }

  /**
   * Get address by ID for checkout (validates ownership and not deleted)
   * Used by sales order service during checkout
   */
  async getAddressForCheckout(
    addressId: number,
    userId: number,
  ): Promise<UserAddress> {
    const address = await this.userAddressRepository.findByIdAndUserId(
      addressId,
      userId,
    );

    if (!address) {
      throw new NotFoundException(
        `Address with ID ${addressId} not found or does not belong to user`,
      );
    }

    return address;
  }

  /**
   * Get default address for checkout (used when no address_id provided)
   * Used by sales order service during checkout
   */
  async getDefaultAddressForCheckout(userId: number): Promise<UserAddress> {
    const address =
      await this.userAddressRepository.findDefaultByUserId(userId);

    if (!address) {
      throw new UnprocessableEntityException({
        status: 422,
        errors: {
          address: 'No default address found. Please add an address first.',
        },
      });
    }

    return address;
  }
}
