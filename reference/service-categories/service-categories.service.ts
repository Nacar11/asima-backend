import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BaseServiceCategoryRepository } from '@/service-categories/persistence/base-service-category.repository';
import { CreateServiceCategoryDto } from '@/service-categories/dto/create-service-category.dto';
import { UpdateServiceCategoryDto } from '@/service-categories/dto/update-service-category.dto';
import { QueryServiceCategoryDto } from '@/service-categories/dto/query-service-category.dto';
import { ServiceCategory } from '@/service-categories/domain/service-category';
import { User } from '@/users/domain/user';

@Injectable()
export class ServiceCategoriesService {
  constructor(private readonly repository: BaseServiceCategoryRepository) {}

  private ensureCode(code: string | undefined, name: string): string {
    const base = code?.trim() || name;
    return base
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  async create(dto: CreateServiceCategoryDto, causer: User) {
    const code = this.ensureCode(dto.code, dto.name);
    const existing = await this.repository.findByCode(code);
    if (existing) {
      throw new BadRequestException('Code already exists');
    }

    const category = Object.assign(new ServiceCategory(), dto, {
      code,
      level: dto.level ?? 0,
      display_order: dto.display_order ?? 0,
      is_active: dto.is_active ?? true,
      is_featured: dto.is_featured ?? false,
      status: dto.status ?? 'Active',
      default_platform_fee_percent: dto.default_platform_fee_percent ?? 10,
      created_by: causer,
      updated_by: causer,
    });
    return this.repository.create(category);
  }

  async findAll(query: QueryServiceCategoryDto) {
    return this.repository.findAll(query);
  }

  async findById(id: number) {
    const category = await this.repository.findById(id);
    if (!category) throw new NotFoundException('Service category not found');
    return category;
  }

  async update(id: number, dto: UpdateServiceCategoryDto, causer: User) {
    const category = await this.findById(id);
    let code = category.code;
    if (dto.name || dto.code) {
      code = this.ensureCode(dto.code, dto.name ?? category.name);
      const dup = await this.repository.findByCode(code);
      if (dup && dup.id !== id) {
        throw new BadRequestException('Code already exists');
      }
    }
    return this.repository.update(id, {
      ...dto,
      code,
      updated_by: causer,
    });
  }

  async remove(id: number, causer: User) {
    await this.findById(id);
    await this.repository.remove(id, causer?.id);
  }

  async findFeatured(limit?: number) {
    const parsedLimit = Number(limit);
    const take =
      Number.isFinite(parsedLimit) && parsedLimit > 0 ? parsedLimit : 10;
    return this.repository.findFeatured(take);
  }

  async lookup(search?: string, take?: number, skip?: number) {
    return this.repository.lookup(search, take, skip);
  }

  async bulkDelete(
    ids: number[],
    causer: User,
  ): Promise<{
    deleted: number;
    failed: number;
    errors: string[];
  }> {
    if (!ids || ids.length === 0) {
      throw new BadRequestException('No service category IDs provided');
    }

    // Validate that all IDs are valid numbers
    const invalidIds = ids.filter((id) => !Number.isInteger(id) || id <= 0);
    if (invalidIds.length > 0) {
      throw new BadRequestException(
        `Invalid service category IDs: ${invalidIds.join(', ')}`,
      );
    }

    let deleted = 0;
    let failed = 0;
    const errors: string[] = [];

    // Process each deletion individually
    for (const id of ids) {
      try {
        await this.remove(id, causer);
        deleted++;
      } catch (error) {
        failed++;
        if (error instanceof NotFoundException) {
          errors.push(`Service category ${id} not found`);
        } else {
          errors.push(
            `Failed to delete service category ${id}: ${error.message}`,
          );
        }
      }
    }

    return {
      deleted,
      failed,
      errors,
    };
  }
}
