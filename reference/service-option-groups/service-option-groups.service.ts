import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BaseServiceOptionGroupRepository } from '@/service-option-groups/persistence/base-service-option-group.repository';
import { CreateServiceOptionGroupDto } from '@/service-option-groups/dto/create-service-option-group.dto';
import { UpdateServiceOptionGroupDto } from '@/service-option-groups/dto/update-service-option-group.dto';
import { QueryServiceOptionGroupDto } from '@/service-option-groups/dto/query-service-option-group.dto';
import { ServiceOptionGroup } from '@/service-option-groups/domain/service-option-group';
import { ServicesService } from '@/services/services.service';
import { User } from '@/users/domain/user';
import { OptionGroupInputTypeEnum } from '@/service-option-groups/enums/option-group-input-type.enum';
import { OptionGroupStatusEnum } from '@/service-option-groups/enums/option-group-status.enum';

@Injectable()
export class ServiceOptionGroupsService {
  constructor(
    private readonly repository: BaseServiceOptionGroupRepository,
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
      throw new ConflictException(
        'Option group code already exists for this service',
      );
    }
  }

  async create(
    dto: CreateServiceOptionGroupDto,
    causer: User,
  ): Promise<ServiceOptionGroup> {
    // Verify service exists
    await this.servicesService.findById(dto.service_id);

    // Ensure code is unique within service
    await this.ensureCodeUnique(dto.service_id, dto.code);

    const model = Object.assign(new ServiceOptionGroup(), {
      service_id: dto.service_id,
      name: dto.name,
      code: dto.code,
      description: dto.description ?? null,
      input_type: dto.input_type ?? OptionGroupInputTypeEnum.SELECT,
      min_value: dto.min_value ?? 0,
      max_value: dto.max_value ?? 10,
      default_value: dto.default_value ?? 1,
      display_order: dto.display_order ?? 0,
      is_required: dto.is_required ?? true,
      status: dto.status ?? OptionGroupStatusEnum.ACTIVE,
      created_by: causer?.id ?? null,
      updated_by: causer?.id ?? null,
    });

    return this.repository.create(model);
  }

  async findAll(query: QueryServiceOptionGroupDto) {
    return this.repository.findAll(query);
  }

  async findById(id: number): Promise<ServiceOptionGroup> {
    const item = await this.repository.findById(id);
    if (!item) throw new NotFoundException('Service Option Group not found');
    return item;
  }

  async findByServiceId(serviceId: number): Promise<ServiceOptionGroup[]> {
    return this.repository.findByServiceId(serviceId);
  }

  async update(
    id: number,
    dto: UpdateServiceOptionGroupDto,
    causer: User,
  ): Promise<ServiceOptionGroup> {
    const existing = await this.findById(id);

    if (dto.code !== undefined && dto.code !== existing.code) {
      await this.ensureCodeUnique(existing.service_id, dto.code, id);
    }

    return this.repository.update(id, {
      ...dto,
      updated_by: causer?.id ?? null,
    });
  }

  async remove(id: number, causer: User): Promise<void> {
    await this.findById(id);
    await this.repository.remove(id, causer?.id);
  }
}
