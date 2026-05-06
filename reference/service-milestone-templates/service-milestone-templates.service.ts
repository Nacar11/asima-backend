import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BaseServiceMilestoneTemplateRepository } from '@/service-milestone-templates/persistence/base-service-milestone-template.repository';
import { CreateServiceMilestoneTemplateDto } from '@/service-milestone-templates/dto/create-service-milestone-template.dto';
import { UpdateServiceMilestoneTemplateDto } from '@/service-milestone-templates/dto/update-service-milestone-template.dto';
import { QueryServiceMilestoneTemplateDto } from '@/service-milestone-templates/dto/query-service-milestone-template.dto';
import { ServiceMilestoneTemplate } from '@/service-milestone-templates/domain/service-milestone-template';
import { ServicesService } from '@/services/services.service';
import { ServicePackagesService } from '@/service-packages/service-packages.service';
import { User } from '@/users/domain/user';
import { ServiceMilestoneTemplateStatusEnum } from '@/service-milestone-templates/enums/service-milestone-template-status.enum';
import { MilestoneTypeEnum } from '@/booking-milestones/enums/milestone-type.enum';

@Injectable()
export class ServiceMilestoneTemplatesService {
  constructor(
    private readonly repository: BaseServiceMilestoneTemplateRepository,
    private readonly servicesService: ServicesService,
    private readonly servicePackagesService: ServicePackagesService,
  ) {}

  private async ensureSequenceUnique(
    serviceId: number,
    sequenceOrder: number,
    excludeId?: number,
  ) {
    const existing = await this.repository.findByServiceAndSequence(
      serviceId,
      sequenceOrder,
      excludeId,
    );
    if (existing) {
      throw new ConflictException(
        'sequence_order already exists for this service',
      );
    }
  }

  async create(dto: CreateServiceMilestoneTemplateDto, causer: User) {
    await this.servicesService.findById(dto.service_id);
    if (dto.package_id) {
      await this.servicePackagesService.findById(dto.package_id);
    }
    await this.ensureSequenceUnique(dto.service_id, dto.sequence_order);

    const model = Object.assign(new ServiceMilestoneTemplate(), dto, {
      description: dto.description ?? null,
      template_type: dto.template_type ?? MilestoneTypeEnum.MILESTONE,
      category: dto.category ?? null,
      response_type: dto.response_type ?? null,
      measurement_unit: dto.measurement_unit ?? null,
      is_required: dto.is_required ?? false,
      estimated_duration_hours: dto.estimated_duration_hours ?? null,
      estimated_duration_days: dto.estimated_duration_days ?? null,
      payment_percent: dto.payment_percent ?? 0,
      deliverables: dto.deliverables ?? null,
      requires_customer_approval: dto.requires_customer_approval ?? true,
      auto_approve_after_hours: dto.auto_approve_after_hours ?? 48,
      status: dto.status ?? ServiceMilestoneTemplateStatusEnum.ACTIVE,
      created_by: causer,
      updated_by: causer,
    });
    return this.repository.create(model);
  }

  async findAll(query: QueryServiceMilestoneTemplateDto) {
    return this.repository.findAll(query);
  }

  async findById(id: number) {
    const item = await this.repository.findById(id);
    if (!item)
      throw new NotFoundException('Service Milestone Template not found');
    return item;
  }

  async update(
    id: number,
    dto: UpdateServiceMilestoneTemplateDto,
    causer: User,
  ) {
    const existing = await this.findById(id);
    if (dto.service_id && dto.service_id !== existing.service_id) {
      await this.servicesService.findById(dto.service_id);
    }
    if (dto.package_id !== undefined && dto.package_id !== null) {
      await this.servicePackagesService.findById(dto.package_id);
    }
    if (dto.sequence_order !== undefined) {
      await this.ensureSequenceUnique(
        dto.service_id ?? existing.service_id,
        dto.sequence_order,
        id,
      );
    }

    return this.repository.update(id, {
      ...dto,
      updated_by: causer,
    });
  }

  async remove(id: number, causer: User) {
    await this.findById(id);
    await this.repository.remove(id, causer?.id);
  }
}
