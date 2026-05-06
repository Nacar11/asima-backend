import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BaseServiceOptionValueRepository } from '@/service-option-values/persistence/base-service-option-value.repository';
import { CreateServiceOptionValueDto } from '@/service-option-values/dto/create-service-option-value.dto';
import { UpdateServiceOptionValueDto } from '@/service-option-values/dto/update-service-option-value.dto';
import { QueryServiceOptionValueDto } from '@/service-option-values/dto/query-service-option-value.dto';
import { ServiceOptionValue } from '@/service-option-values/domain/service-option-value';
import { ServiceOptionGroupsService } from '@/service-option-groups/service-option-groups.service';
import { OptionValueStatusEnum } from '@/service-option-values/enums/option-value-status.enum';

@Injectable()
export class ServiceOptionValuesService {
  constructor(
    private readonly repository: BaseServiceOptionValueRepository,
    private readonly optionGroupsService: ServiceOptionGroupsService,
  ) {}

  private async ensureValueUnique(
    optionGroupId: number,
    value: string,
    excludeId?: number,
  ) {
    const existing = await this.repository.findByGroupAndValue(
      optionGroupId,
      value,
      excludeId,
    );
    if (existing) {
      throw new ConflictException(
        'Option value already exists for this option group',
      );
    }
  }

  async create(dto: CreateServiceOptionValueDto): Promise<ServiceOptionValue> {
    // Verify option group exists
    await this.optionGroupsService.findById(dto.option_group_id);

    // Ensure value is unique within option group
    await this.ensureValueUnique(dto.option_group_id, dto.value);

    const model = Object.assign(new ServiceOptionValue(), {
      option_group_id: dto.option_group_id,
      label: dto.label,
      value: dto.value,
      description: dto.description ?? null,
      price_adjustment: dto.price_adjustment ?? 0,
      price_multiplier: dto.price_multiplier ?? 1.0,
      duration_adjustment_minutes: dto.duration_adjustment_minutes ?? 0,
      icon_url: dto.icon_url ?? null,
      display_order: dto.display_order ?? 0,
      is_default: dto.is_default ?? false,
      status: dto.status ?? OptionValueStatusEnum.ACTIVE,
    });

    return this.repository.create(model);
  }

  async findAll(query: QueryServiceOptionValueDto) {
    return this.repository.findAll(query);
  }

  async findById(id: number): Promise<ServiceOptionValue> {
    const item = await this.repository.findById(id);
    if (!item) throw new NotFoundException('Service Option Value not found');
    return item;
  }

  async findByOptionGroupId(
    optionGroupId: number,
  ): Promise<ServiceOptionValue[]> {
    return this.repository.findByOptionGroupId(optionGroupId);
  }

  async update(
    id: number,
    dto: UpdateServiceOptionValueDto,
  ): Promise<ServiceOptionValue> {
    const existing = await this.findById(id);

    if (dto.value !== undefined && dto.value !== existing.value) {
      await this.ensureValueUnique(existing.option_group_id, dto.value, id);
    }

    return this.repository.update(id, dto);
  }

  async remove(id: number): Promise<void> {
    await this.findById(id);
    await this.repository.remove(id);
  }
}
