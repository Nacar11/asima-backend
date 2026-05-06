import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { ShippingZoneEntity } from '@/shipping/persistence/entities/shipping-zone.entity';
import { ShippingZoneAreaEntity } from '@/shipping/persistence/entities/shipping-zone-area.entity';
import { ShippingZone } from '@/shipping/domain/shipping-zone';
import { ShippingZoneMapper } from '@/shipping/persistence/mappers/shipping-zone.mapper';
import { UserEntity } from '@/users/persistence/entities/user.entity';
import {
  CreateShippingZoneDto,
  CreateZoneAreaDto,
} from '@/shipping/dto/create-shipping-zone.dto';
import { UpdateShippingZoneDto } from '@/shipping/dto/update-shipping-zone.dto';

@Injectable()
export class ShippingZoneRepository {
  constructor(
    @InjectRepository(ShippingZoneEntity)
    private readonly zoneRepository: Repository<ShippingZoneEntity>,
    @InjectRepository(ShippingZoneAreaEntity)
    private readonly areaRepository: Repository<ShippingZoneAreaEntity>,
  ) {}

  async create(
    dto: CreateShippingZoneDto,
    user?: UserEntity,
  ): Promise<ShippingZone> {
    // Auto-increment priority if not provided (scoped to provider)
    let priority = dto.priority;
    if (priority === undefined || priority === null) {
      const maxResult = await this.zoneRepository
        .createQueryBuilder('zone')
        .select('MAX(zone.priority)', 'max')
        .where('zone.provider_id = :providerId', {
          providerId: dto.provider_id,
        })
        .getRawOne();
      priority = (maxResult?.max ?? -1) + 1;
    }

    const entity = this.zoneRepository.create({
      provider_id: dto.provider_id,
      name: dto.name,
      description: dto.description,
      is_default: dto.is_default ?? false,
      is_active: dto.is_active ?? true,
      priority,
      created_by: user ?? null,
      updated_by: user ?? null,
    });

    const saved = await this.zoneRepository.save(entity);

    // Create areas if provided
    if (dto.areas && dto.areas.length > 0) {
      await this.createAreas(saved.id, dto.areas);
    }

    return this.findById(saved.id) as Promise<ShippingZone>;
  }

  async createAreas(zoneId: number, areas: CreateZoneAreaDto[]): Promise<void> {
    const entities = areas.map((area) =>
      this.areaRepository.create({
        zone_id: zoneId,
        area_type: area.area_type,
        area_value: area.area_value,
      }),
    );

    await this.areaRepository.save(entities);
  }

  async findAll(providerId?: number): Promise<ShippingZone[]> {
    const queryBuilder = this.zoneRepository
      .createQueryBuilder('zone')
      .leftJoinAndSelect('zone.areas', 'areas')
      .leftJoinAndSelect('zone.created_by', 'created_by')
      .leftJoinAndSelect('zone.updated_by', 'updated_by')
      .where('zone.deleted_at IS NULL');

    if (providerId) {
      queryBuilder.andWhere('zone.provider_id = :providerId', { providerId });
    }

    queryBuilder
      .orderBy('zone.priority', 'DESC')
      .addOrderBy('zone.name', 'ASC');

    const entities = await queryBuilder.getMany();
    return entities.map((entity) => ShippingZoneMapper.toDomain(entity));
  }

  async findById(id: number): Promise<ShippingZone | null> {
    const entity = await this.zoneRepository.findOne({
      where: { id, deleted_at: IsNull() },
      relations: ['areas', 'created_by', 'updated_by'],
    });

    return entity ? ShippingZoneMapper.toDomain(entity) : null;
  }

  async findActiveByProviderId(providerId: number): Promise<ShippingZone[]> {
    const entities = await this.zoneRepository.find({
      where: {
        provider_id: providerId,
        is_active: true,
        deleted_at: IsNull(),
      },
      relations: ['areas'],
      order: { priority: 'DESC', name: 'ASC' },
    });

    return entities.map((entity) => ShippingZoneMapper.toDomain(entity));
  }

  async findDefaultZone(providerId: number): Promise<ShippingZone | null> {
    const entity = await this.zoneRepository.findOne({
      where: {
        provider_id: providerId,
        is_default: true,
        is_active: true,
        deleted_at: IsNull(),
      },
      relations: ['areas'],
    });

    return entity ? ShippingZoneMapper.toDomain(entity) : null;
  }

  async update(
    id: number,
    dto: UpdateShippingZoneDto,
    user?: UserEntity,
  ): Promise<ShippingZone | null> {
    const entity = await this.zoneRepository.findOne({
      where: { id, deleted_at: IsNull() },
    });

    if (!entity) {
      return null;
    }

    // Update zone fields
    if (dto.name !== undefined) entity.name = dto.name;
    if (dto.description !== undefined) entity.description = dto.description;
    if (dto.is_default !== undefined) entity.is_default = dto.is_default;
    if (dto.is_active !== undefined) entity.is_active = dto.is_active;
    if (dto.priority !== undefined) entity.priority = dto.priority;
    if (user) entity.updated_by = user;

    await this.zoneRepository.save(entity);

    // Update areas if provided
    if (dto.areas !== undefined) {
      // Remove existing areas
      await this.areaRepository.delete({ zone_id: id });
      // Create new areas
      if (dto.areas.length > 0) {
        await this.createAreas(id, dto.areas);
      }
    }

    return this.findById(id);
  }

  async remove(id: number): Promise<boolean> {
    const result = await this.zoneRepository.softDelete(id);
    return (result.affected ?? 0) > 0;
  }

  async clearDefaultFlag(
    providerId: number,
    excludeId?: number,
  ): Promise<void> {
    const queryBuilder = this.zoneRepository
      .createQueryBuilder()
      .update()
      .set({ is_default: false })
      .where('provider_id = :providerId', { providerId })
      .andWhere('is_default = true');

    if (excludeId) {
      queryBuilder.andWhere('id != :excludeId', { excludeId });
    }

    await queryBuilder.execute();
  }
}
