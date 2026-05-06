import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { UserAddressEntity } from '../entities/user-address.entity';
import { UserAddress } from '@/user-addresses/domain/user-address';
import { UserAddressMapper } from '../mappers/user-address.mapper';
import { BaseUserAddressRepository } from '../base-user-address.repository';

@Injectable()
export class UserAddressRepository extends BaseUserAddressRepository {
  constructor(
    @InjectRepository(UserAddressEntity)
    private readonly repository: Repository<UserAddressEntity>,
  ) {
    super();
  }

  async findById(id: number): Promise<UserAddress | null> {
    const entity = await this.repository.findOne({
      where: { id, deleted_at: IsNull() },
      relations: ['created_by', 'updated_by'],
    });
    return entity ? UserAddressMapper.toDomain(entity) : null;
  }

  async findByIdAndUserId(
    id: number,
    userId: number,
  ): Promise<UserAddress | null> {
    const entity = await this.repository.findOne({
      where: { id, user_id: userId, deleted_at: IsNull() },
      relations: ['created_by', 'updated_by'],
    });
    return entity ? UserAddressMapper.toDomain(entity) : null;
  }

  async findAllByUserId(userId: number): Promise<UserAddress[]> {
    const entities = await this.repository.find({
      where: { user_id: userId, deleted_at: IsNull() },
      relations: ['created_by', 'updated_by'],
      order: {
        is_default: 'DESC',
        created_at: 'DESC',
      },
    });
    return entities.map((entity) => UserAddressMapper.toDomain(entity));
  }

  async findDefaultByUserId(userId: number): Promise<UserAddress | null> {
    const entity = await this.repository.findOne({
      where: { user_id: userId, is_default: true, deleted_at: IsNull() },
      relations: ['created_by', 'updated_by'],
    });
    return entity ? UserAddressMapper.toDomain(entity) : null;
  }

  async countByUserId(userId: number): Promise<number> {
    return await this.repository.count({
      where: { user_id: userId, deleted_at: IsNull() },
    });
  }

  async create(data: Partial<UserAddress>): Promise<UserAddress> {
    const entity = this.repository.create(
      UserAddressMapper.toPersistence(data as UserAddress),
    );
    const savedEntity = await this.repository.save(entity);

    // Reload with relations
    const reloadedEntity = await this.repository.findOne({
      where: { id: savedEntity.id },
      relations: ['created_by', 'updated_by'],
    });

    return UserAddressMapper.toDomain(reloadedEntity!);
  }

  async update(id: number, data: Partial<UserAddress>): Promise<UserAddress> {
    const existingEntity = await this.repository.findOne({
      where: { id, deleted_at: IsNull() },
    });

    if (!existingEntity) {
      throw new NotFoundException(`Address with ID ${id} not found`);
    }

    // Merge existing entity with update data
    const updatedData = {
      ...existingEntity,
      ...data,
      id, // Ensure ID is preserved
    };

    await this.repository.save(
      UserAddressMapper.toPersistence(updatedData as UserAddress),
    );

    // Reload with relations
    const reloadedEntity = await this.repository.findOne({
      where: { id },
      relations: ['created_by', 'updated_by'],
    });

    return UserAddressMapper.toDomain(reloadedEntity!);
  }

  async softDelete(id: number, deletedBy: number): Promise<void> {
    await this.repository.update(id, {
      deleted_at: new Date(),
      deleted_by: { id: deletedBy } as any,
    });
  }

  async unsetDefaultForUser(userId: number): Promise<void> {
    await this.repository.update(
      { user_id: userId, is_default: true, deleted_at: IsNull() },
      { is_default: false },
    );
  }

  async setAsDefault(id: number, userId: number): Promise<UserAddress> {
    // First, unset all defaults for this user
    await this.unsetDefaultForUser(userId);

    // Then set the specified address as default
    await this.repository.update(id, { is_default: true });

    // Reload and return
    const entity = await this.repository.findOne({
      where: { id },
      relations: ['created_by', 'updated_by'],
    });

    if (!entity) {
      throw new NotFoundException(`Address with ID ${id} not found`);
    }

    return UserAddressMapper.toDomain(entity);
  }
}
