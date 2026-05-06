import {
  Injectable,
  Inject,
  forwardRef,
  NotFoundException,
} from '@nestjs/common';
import { BaseServiceGalleryRepository } from '@/service-gallery/persistence/base-service-gallery.repository';
import { CreateServiceGalleryDto } from '@/service-gallery/dto/create-service-gallery.dto';
import { UpdateServiceGalleryDto } from '@/service-gallery/dto/update-service-gallery.dto';
import { QueryServiceGalleryDto } from '@/service-gallery/dto/query-service-gallery.dto';
import { ServiceGallery } from '@/service-gallery/domain/service-gallery';
import { ServicesService } from '@/services/services.service';
import { User } from '@/users/domain/user';

@Injectable()
export class ServiceGalleryService {
  constructor(
    private readonly repository: BaseServiceGalleryRepository,
    @Inject(forwardRef(() => ServicesService))
    private readonly servicesService: ServicesService,
  ) {}

  async create(dto: CreateServiceGalleryDto, causer: User) {
    await this.servicesService.findById(dto.service_id);
    const gallery = Object.assign(new ServiceGallery(), dto, {
      caption: dto.caption ?? null,
      alt_text: dto.alt_text ?? null,
      is_primary: dto.is_primary ?? false,
      display_order: dto.display_order ?? 0,
      status: dto.status ?? 'Active',
      created_by: causer,
      updated_by: causer,
    });
    const created = await this.repository.create(gallery);
    if (created.is_primary) {
      await this.repository.unsetPrimaryForService(
        created.service_id,
        created.id,
      );
    }
    return created;
  }

  async findAll(query: QueryServiceGalleryDto) {
    return this.repository.findAll(query);
  }

  async findById(id: number) {
    const item = await this.repository.findById(id);
    if (!item) throw new NotFoundException('Service Gallery not found');
    return item;
  }

  async update(id: number, dto: UpdateServiceGalleryDto, causer: User) {
    const existing = await this.findById(id);
    if (dto.service_id && dto.service_id !== existing.service_id) {
      await this.servicesService.findById(dto.service_id);
    }
    const updated = await this.repository.update(id, {
      ...dto,
      updated_by: causer,
    });
    if (updated.is_primary) {
      await this.repository.unsetPrimaryForService(
        updated.service_id,
        updated.id,
      );
    }
    return updated;
  }

  async remove(id: number, causer: User) {
    await this.findById(id);
    await this.repository.remove(id, causer?.id);
  }
}
