import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BaseServiceAddonRepository } from '@/service-addons/persistence/base-service-addon.repository';
import { CreateServiceAddonDto } from '@/service-addons/dto/create-service-addon.dto';
import { UpdateServiceAddonDto } from '@/service-addons/dto/update-service-addon.dto';
import { QueryServiceAddonDto } from '@/service-addons/dto/query-service-addon.dto';
import { ServiceAddon } from '@/service-addons/domain/service-addon';
import { ServicesService } from '@/services/services.service';
import { User } from '@/users/domain/user';
import { AddonStatusEnum } from '@/service-addons/enums/addon-status.enum';

@Injectable()
export class ServiceAddonsService {
  constructor(
    private readonly repository: BaseServiceAddonRepository,
    private readonly servicesService: ServicesService,
  ) {}

  private async ensureCodeUnique(
    serviceId: number,
    code: string,
    excludeId?: number,
  ) {
    const existing = await this.repository.findByServiceAndCode(
      serviceId,
      code,
      excludeId,
    );
    if (existing) {
      throw new ConflictException('Addon code already exists for this service');
    }
  }

  async create(
    dto: CreateServiceAddonDto,
    causer: User,
  ): Promise<ServiceAddon> {
    // Verify service exists
    await this.servicesService.findById(dto.service_id);

    // Ensure code is unique within service
    await this.ensureCodeUnique(dto.service_id, dto.code);

    const model = Object.assign(new ServiceAddon(), {
      service_id: dto.service_id,
      name: dto.name,
      code: dto.code,
      description: dto.description ?? null,
      short_description: dto.short_description ?? null,
      unit_type: dto.unit_type ?? null,
      price: dto.price,
      compare_at_price: dto.compare_at_price ?? null,
      duration_minutes: dto.duration_minutes ?? null,
      min_quantity: dto.min_quantity ?? 0,
      max_quantity: dto.max_quantity ?? 10,
      display_order: dto.display_order ?? 0,
      icon_url: dto.icon_url ?? null,
      image_url: dto.image_url ?? null,
      is_popular: dto.is_popular ?? false,
      is_required: dto.is_required ?? false,
      status: dto.status ?? AddonStatusEnum.ACTIVE,
      inclusions: [],
      created_by: causer?.id ?? null,
      updated_by: causer?.id ?? null,
    });

    const created = await this.repository.create(model);

    // Handle inclusions if provided
    if (dto.inclusions && dto.inclusions.length > 0) {
      await this.repository.saveInclusions(
        created.id,
        dto.inclusions.map((inc, idx) => ({
          description: inc.description,
          display_order: inc.display_order ?? idx,
        })),
      );
      // Refresh to get inclusions
      return this.findById(created.id);
    }

    return created;
  }

  async findAll(query: QueryServiceAddonDto) {
    return this.repository.findAll(query);
  }

  async findById(id: number): Promise<ServiceAddon> {
    const item = await this.repository.findById(id);
    if (!item) throw new NotFoundException('Service Addon not found');
    return item;
  }

  async findByServiceId(serviceId: number): Promise<ServiceAddon[]> {
    return this.repository.findByServiceId(serviceId);
  }

  async update(
    id: number,
    dto: UpdateServiceAddonDto,
    causer: User,
  ): Promise<ServiceAddon> {
    const existing = await this.findById(id);

    if (dto.code !== undefined && dto.code !== existing.code) {
      await this.ensureCodeUnique(existing.service_id, dto.code, id);
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { inclusions: _, ...updateData } = dto;
    const updated = await this.repository.update(id, {
      ...updateData,
      updated_by: causer?.id ?? null,
    });

    // Handle inclusions if provided
    if (dto.inclusions !== undefined) {
      await this.repository.saveInclusions(
        id,
        dto.inclusions.map((inc, idx) => ({
          id: inc.id,
          description: inc.description,
          display_order: inc.display_order ?? idx,
        })),
      );
      // Refresh to get updated inclusions
      return this.findById(id);
    }

    return updated;
  }

  async remove(id: number, causer: User): Promise<void> {
    await this.findById(id);
    await this.repository.remove(id, causer?.id);
  }

  async removeMany(ids: number[], causer: User): Promise<void> {
    await this.repository.removeMany(ids, causer?.id);
  }
}
