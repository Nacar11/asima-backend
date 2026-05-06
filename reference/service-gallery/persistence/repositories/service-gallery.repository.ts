import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, ILike, Not, Repository } from 'typeorm';
import { BaseServiceGalleryRepository } from '@/service-gallery/persistence/base-service-gallery.repository';
import { ServiceGalleryEntity } from '@/service-gallery/persistence/entities/service-gallery.entity';
import { ServiceGalleryMapper } from '@/service-gallery/persistence/mappers/service-gallery.mapper';
import { ServiceGallery } from '@/service-gallery/domain/service-gallery';
import { QueryServiceGalleryDto } from '@/service-gallery/dto/query-service-gallery.dto';

@Injectable()
export class ServiceGalleryRepository implements BaseServiceGalleryRepository {
  constructor(
    @InjectRepository(ServiceGalleryEntity)
    private readonly repo: Repository<ServiceGalleryEntity>,
  ) {}

  async unsetPrimaryForService(
    serviceId: number,
    excludeId?: number,
  ): Promise<void> {
    const criteria: FindOptionsWhere<ServiceGalleryEntity> = {
      service_id: serviceId,
      is_primary: true,
    };
    if (excludeId) criteria.id = Not(excludeId);
    await this.repo.update(criteria, { is_primary: false });
  }

  async create(data: ServiceGallery): Promise<ServiceGallery> {
    const saved = await this.repo.save(
      this.repo.create(ServiceGalleryMapper.toPersistence(data)),
    );
    const withRelations = await this.repo.findOne({
      where: { id: saved.id },
      relations: ['service', 'created_by', 'updated_by', 'deleted_by'],
    });
    return ServiceGalleryMapper.toDomain(withRelations ?? saved);
  }

  async findAll(
    query: QueryServiceGalleryDto,
  ): Promise<{ data: ServiceGallery[]; totalCount: number }> {
    const skip = query.skip ?? 0;
    const take = query.take ?? 20;

    const where: FindOptionsWhere<ServiceGalleryEntity>[] = [];
    if (query.search) {
      const like = ILike(`%${query.search}%`);
      where.push({ caption: like });
      where.push({ alt_text: like });
    }
    if (query.service_id !== undefined)
      where.push({ service_id: query.service_id });
    if (query.is_primary !== undefined)
      where.push({ is_primary: query.is_primary });
    if (where.length === 0) where.push({});

    const [entities, totalCount] = await this.repo.findAndCount({
      where,
      skip,
      take,
      order: { display_order: 'ASC', created_at: 'DESC' },
      relations: ['service', 'created_by', 'updated_by', 'deleted_by'],
    });

    return {
      data: entities.map((e) => ServiceGalleryMapper.toDomain(e)),
      totalCount,
    };
  }

  async findById(id: number): Promise<ServiceGallery | null> {
    const entity = await this.repo.findOne({
      where: { id },
      relations: ['service', 'created_by', 'updated_by', 'deleted_by'],
    });
    return entity ? ServiceGalleryMapper.toDomain(entity) : null;
  }

  async update(
    id: number,
    payload: Partial<ServiceGallery>,
  ): Promise<ServiceGallery> {
    const existing = await this.repo.findOne({ where: { id } });
    if (!existing) throw new NotFoundException('Service Gallery not found');

    const updated = await this.repo.save(
      this.repo.create(
        ServiceGalleryMapper.toPersistence({
          ...ServiceGalleryMapper.toDomain(existing),
          ...payload,
        }),
      ),
    );
    const withRelations = await this.repo.findOne({
      where: { id: updated.id },
      relations: ['service', 'created_by', 'updated_by', 'deleted_by'],
    });
    return ServiceGalleryMapper.toDomain(withRelations ?? updated);
  }

  async remove(id: number, causerId?: number): Promise<void> {
    const existing = await this.repo.findOne({ where: { id } });
    if (!existing) throw new NotFoundException('Service Gallery not found');
    await this.repo.save({
      id,
      deleted_at: new Date(),
      deleted_by: causerId ? ({ id: causerId } as any) : null,
      is_primary: false,
    });
  }
}
