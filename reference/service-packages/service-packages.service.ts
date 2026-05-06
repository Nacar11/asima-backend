import {
  Injectable,
  Inject,
  forwardRef,
  NotFoundException,
} from '@nestjs/common';
import { BaseServicePackageRepository } from '@/service-packages/persistence/base-service-package.repository';
import { CreateServicePackageDto } from '@/service-packages/dto/create-service-package.dto';
import { UpdateServicePackageDto } from '@/service-packages/dto/update-service-package.dto';
import { QueryServicePackageDto } from '@/service-packages/dto/query-service-package.dto';
import { BulkDeleteServicePackagesDto } from '@/service-packages/dto/bulk-delete-service-packages.dto';
import { ServicePackage } from '@/service-packages/domain/service-package';
import { ServicesService } from '@/services/services.service';
import { ServicePackageStatusEnum } from '@/service-packages/enums/service-package-status.enum';
import { User } from '@/users/domain/user';

@Injectable()
export class ServicePackagesService {
  constructor(
    private readonly repository: BaseServicePackageRepository,
    @Inject(forwardRef(() => ServicesService))
    private readonly servicesService: ServicesService,
  ) {}

  async create(dto: CreateServicePackageDto, causer: User) {
    await this.servicesService.findById(dto.service_id);
    const pkg = Object.assign(new ServicePackage(), dto, {
      compare_at_price: dto.compare_at_price ?? null,
      duration_minutes: dto.duration_minutes ?? null,
      inclusions: dto.inclusions ?? null,
      max_bookings_per_day: dto.max_bookings_per_day ?? null,
      is_popular: dto.is_popular ?? false,
      display_order: dto.display_order ?? 0,
      status: dto.status ?? ServicePackageStatusEnum.ACTIVE,
      created_by: causer,
      updated_by: causer,
    });
    return this.repository.create(pkg);
  }

  async findAll(query: QueryServicePackageDto) {
    return this.repository.findAll(query);
  }

  async findById(id: number) {
    const pkg = await this.repository.findById(id);
    if (!pkg) throw new NotFoundException('Service Package not found');
    return pkg;
  }

  async update(id: number, dto: UpdateServicePackageDto, causer: User) {
    const existing = await this.findById(id);
    if (dto.service_id && dto.service_id !== existing.service_id) {
      await this.servicesService.findById(dto.service_id);
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

  /**
   * Bulk delete service packages.
   *
   * This method performs soft deletion by updating the same fields as single delete:
   * - deleted_at: Set to current timestamp
   * - deleted_by: Set to the causer's user ID
   * - status: Set to INACTIVE
   *
   * @param dto - Bulk delete DTO containing array of service package IDs
   * @param causer - User performing the deletion
   * @returns Object with deletion results including counts and arrays of successful/failed deletions
   */
  async bulkDelete(dto: BulkDeleteServicePackagesDto, causer: User) {
    const results = {
      deleted: [] as number[],
      failed: [] as Array<{ id: number; error: string }>,
    };

    for (const id of dto.ids) {
      try {
        // Uses the same remove method as single delete, ensuring consistent field updates
        await this.remove(id, causer);
        results.deleted.push(id);
      } catch (error) {
        results.failed.push({
          id,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return {
      deleted: results.deleted.length,
      failed: results.failed.length,
      deleted_ids: results.deleted,
      failed_items: results.failed,
    };
  }
}
