import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { StoreAddress } from '@/store-addresses/domain/store-address';
import { CreateStoreAddressDto } from '@/store-addresses/dto/create-store-address.dto';
import { UpdateStoreAddressDto } from '@/store-addresses/dto/update-store-address.dto';
import { QueryStoreAddressDto } from '@/store-addresses/dto/query-store-address.dto';
import { BaseStoreAddressRepository } from '@/store-addresses/persistence/base-store-address.repository';
import { User } from '@/users/domain/user';

@Injectable()
export class StoreAddressesService {
  constructor(
    private readonly storeAddressRepository: BaseStoreAddressRepository,
  ) {}

  /**
   * Throws ForbiddenException if the current user is not a system admin,
   * is not a seller, or does not own the seller account associated with this address.
   */
  private assertOwnership(sellerId: number, currentUser: User): void {
    if (currentUser.system_admin) return;
    if (!currentUser.seller?.id) {
      throw new ForbiddenException(
        'You must be a seller to manage store addresses',
      );
    }
    if (currentUser.seller.id !== sellerId) {
      throw new ForbiddenException(
        'You do not have permission to manage this store address',
      );
    }
  }

  async create(
    createDto: CreateStoreAddressDto,
    currentUser: User,
  ): Promise<StoreAddress> {
    if (!currentUser.seller?.id) {
      throw new ForbiddenException(
        'You must be a seller to manage store addresses',
      );
    }

    const sellerId = currentUser.seller.id;

    const { data: existing } =
      await this.storeAddressRepository.findAllBySellerId(sellerId, 0, 1);
    const isFirstAddress = existing.length === 0;
    const shouldBeDefault = isFirstAddress || createDto.is_default === true;

    if (shouldBeDefault && !isFirstAddress) {
      await this.storeAddressRepository.unsetDefaultForSeller(sellerId);
    }

    return await this.storeAddressRepository.create({
      seller_id: sellerId,
      label: createDto.label ?? null,
      address_line: createDto.address_line ?? null,
      province: createDto.province ?? null,
      city: createDto.city ?? null,
      barangay: createDto.barangay ?? null,
      postal_code: createDto.postal_code ?? null,
      latitude: createDto.latitude ?? null,
      longitude: createDto.longitude ?? null,
      is_default: shouldBeDefault,
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
    });
  }

  async findAll(
    query: QueryStoreAddressDto,
  ): Promise<{ data: StoreAddress[]; total: number }> {
    return await this.storeAddressRepository.findAllBySellerId(
      query.seller_id,
      query.skip ?? 0,
      query.take ?? 20,
    );
  }

  async findOne(id: number, currentUser: User): Promise<StoreAddress> {
    const address = await this.storeAddressRepository.findById(id);

    if (!address) {
      throw new NotFoundException(`Store address with ID ${id} not found`);
    }

    this.assertOwnership(address.seller_id, currentUser);

    return address;
  }

  async update(
    id: number,
    updateDto: UpdateStoreAddressDto,
    currentUser: User,
  ): Promise<StoreAddress> {
    const existing = await this.storeAddressRepository.findById(id);

    if (!existing) {
      throw new NotFoundException(`Store address with ID ${id} not found`);
    }

    this.assertOwnership(existing.seller_id, currentUser);

    if (updateDto.is_default === true && !existing.is_default) {
      await this.storeAddressRepository.unsetDefaultForSeller(
        existing.seller_id,
      );
    }

    return await this.storeAddressRepository.update(id, {
      ...updateDto,
      updated_by: {
        id: currentUser.id,
        first_name: currentUser.first_name,
        last_name: currentUser.last_name,
      },
    });
  }

  async remove(id: number, currentUser: User): Promise<void> {
    const existing = await this.storeAddressRepository.findById(id);

    if (!existing) {
      throw new NotFoundException(`Store address with ID ${id} not found`);
    }

    this.assertOwnership(existing.seller_id, currentUser);

    if (existing.is_default) {
      await this.storeAddressRepository.softDeleteAndPromoteDefault(
        id,
        existing.seller_id,
        currentUser.id,
      );
    } else {
      await this.storeAddressRepository.softDelete(id, currentUser.id);
    }
  }

  async setAsDefault(id: number, currentUser: User): Promise<StoreAddress> {
    const existing = await this.storeAddressRepository.findById(id);

    if (!existing) {
      throw new NotFoundException(`Store address with ID ${id} not found`);
    }

    this.assertOwnership(existing.seller_id, currentUser);

    if (existing.is_default) {
      return existing;
    }

    return await this.storeAddressRepository.setAsDefault(
      id,
      existing.seller_id,
    );
  }
}
