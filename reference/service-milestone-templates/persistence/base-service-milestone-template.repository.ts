import { ServiceMilestoneTemplate } from '@/service-milestone-templates/domain/service-milestone-template';
import { QueryServiceMilestoneTemplateDto } from '@/service-milestone-templates/dto/query-service-milestone-template.dto';

export abstract class BaseServiceMilestoneTemplateRepository {
  abstract create(
    data: Omit<
      ServiceMilestoneTemplate,
      'id' | 'created_at' | 'updated_at' | 'deleted_at'
    >,
  ): Promise<ServiceMilestoneTemplate>;

  abstract findAll(
    query: QueryServiceMilestoneTemplateDto,
  ): Promise<{ data: ServiceMilestoneTemplate[]; totalCount: number }>;

  abstract findById(id: number): Promise<ServiceMilestoneTemplate | null>;

  abstract findByServiceAndSequence(
    serviceId: number,
    sequenceOrder: number,
    excludeId?: number,
  ): Promise<ServiceMilestoneTemplate | null>;

  abstract update(
    id: number,
    payload: Partial<ServiceMilestoneTemplate>,
  ): Promise<ServiceMilestoneTemplate>;

  abstract remove(id: number, causerId?: number): Promise<void>;
}
