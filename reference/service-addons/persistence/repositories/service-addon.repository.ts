import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, ILike, Repository, Not, In } from 'typeorm';
import { BaseServiceAddonRepository } from '@/service-addons/persistence/base-service-addon.repository';
import { ServiceAddonEntity } from '@/service-addons/persistence/entities/service-addon.entity';
import { ServiceAddonInclusionEntity } from '@/service-addons/persistence/entities/service-addon-inclusion.entity';
import { ServiceAddonMapper } from '@/service-addons/persistence/mappers/service-addon.mapper';
import { ServiceAddon } from '@/service-addons/domain/service-addon';
import { QueryServiceAddonDto } from '@/service-addons/dto/query-service-addon.dto';
import { AddonStatusEnum } from '@/service-addons/enums/addon-status.enum';

@Injectable()
export class ServiceAddonRepository implements BaseServiceAddonRepository {
  constructor(
    @InjectRepository(ServiceAddonEntity)
    private readonly repo: Repository<ServiceAddonEntity>,
    @InjectRepository(ServiceAddonInclusionEntity)
    private readonly inclusionRepo: Repository<ServiceAddonInclusionEntity>,
  ) {}

  async create(data: ServiceAddon): Promise<ServiceAddon> {
    const saved = await this.repo.save(
      this.repo.create(ServiceAddonMapper.toPersistence(data)),
    );
    const withRelations = await this.repo.findOne({
      where: { id: saved.id },
      relations: ['service', 'inclusions', 'created_by', 'updated_by'],
    });
    return ServiceAddonMapper.toDomain(withRelations ?? saved);
  }

  async findAll(
    query: QueryServiceAddonDto,
  ): Promise<{ data: ServiceAddon[]; totalCount: number }> {
    const skip = query.skip ?? 0;
    const take = query.take ?? 20;

    const where: FindOptionsWhere<ServiceAddonEntity> = {};

    if (query.service_id !== undefined) {
      where.service_id = query.service_id;
    }
    if (query.status !== undefined) {
      where.status = query.status;
    }
    if (query.search) {
      where.name = ILike(`%${query.search}%`);
    }

    const [entities, totalCount] = await this.repo.findAndCount({
      where,
      skip,
      take,
      order: { display_order: 'ASC', id: 'ASC' },
      relations: ['service', 'inclusions', 'created_by', 'updated_by'],
    });

    return {
      data: entities.map((e) => ServiceAddonMapper.toDomain(e)),
      totalCount,
    };
  }

  async findById(id: number): Promise<ServiceAddon | null> {
    const entity = await this.repo.findOne({
      where: { id },
      relations: ['service', 'inclusions', 'created_by', 'updated_by'],
    });
    return entity ? ServiceAddonMapper.toDomain(entity) : null;
  }

  async findByServiceId(serviceId: number): Promise<ServiceAddon[]> {
    const entities = await this.repo.find({
      where: { service_id: serviceId },
      order: { display_order: 'ASC', id: 'ASC' },
      relations: ['inclusions'],
    });
    return entities.map((e) => ServiceAddonMapper.toDomain(e));
  }

  async findByServiceAndCode(
    serviceId: number,
    code: string,
    excludeId?: number,
  ): Promise<ServiceAddon | null> {
    const where: FindOptionsWhere<ServiceAddonEntity> = {
      service_id: serviceId,
      code,
    };
    if (excludeId) where.id = Not(excludeId);
    const entity = await this.repo.findOne({ where });
    return entity ? ServiceAddonMapper.toDomain(entity) : null;
  }

  async update(
    id: number,
    payload: Partial<ServiceAddon>,
  ): Promise<ServiceAddon> {
    const existing = await this.repo.findOne({ where: { id } });
    if (!existing) throw new NotFoundException('Service Addon not found');

    const updated = await this.repo.save(
      this.repo.create(
        ServiceAddonMapper.toPersistence({
          ...ServiceAddonMapper.toDomain(existing),
          ...payload,
        }),
      ),
    );
    const withRelations = await this.repo.findOne({
      where: { id: updated.id },
      relations: ['service', 'inclusions', 'created_by', 'updated_by'],
    });
    return ServiceAddonMapper.toDomain(withRelations ?? updated);
  }

  async remove(id: number, causerId?: number): Promise<void> {
    const existing = await this.repo.findOne({ where: { id } });
    if (!existing) throw new NotFoundException('Service Addon not found');
    await this.repo.save({
      id,
      deleted_at: new Date(),
      deleted_by: causerId ? ({ id: causerId } as any) : null,
      status: AddonStatusEnum.ARCHIVED,
    });
  }

  async removeMany(ids: number[], causerId?: number): Promise<void> {
    if (ids.length === 0) return;
    await this.repo.update(
      { id: In(ids) },
      {
        deleted_at: new Date(),
        deleted_by: causerId ? ({ id: causerId } as any) : null,
        status: AddonStatusEnum.ARCHIVED,
      },
    );
  }

  async saveInclusions(
    addonId: number,
    inclusions: { id?: number; description: string; display_order: number }[],
  ): Promise<void> {
    // Get existing inclusions
    const existing = await this.inclusionRepo.find({
      where: { addon_id: addonId },
    });
    const existingIds = existing.map((e) => e.id);
    const incomingIds = inclusions.filter((i) => i.id).map((i) => i.id!);

    // Delete removed inclusions
    const toDelete = existingIds.filter((id) => !incomingIds.includes(id));
    if (toDelete.length > 0) {
      await this.inclusionRepo.delete({ id: In(toDelete) });
    }

    // Upsert inclusions
    for (const inc of inclusions) {
      if (inc.id) {
        await this.inclusionRepo.update(inc.id, {
          description: inc.description,
          display_order: inc.display_order,
        });
      } else {
        await this.inclusionRepo.save(
          this.inclusionRepo.create({
            addon_id: addonId,
            description: inc.description,
            display_order: inc.display_order,
          }),
        );
      }
    }
  }
}
