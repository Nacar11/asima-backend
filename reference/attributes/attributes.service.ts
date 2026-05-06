import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { Attribute } from './domain/attribute';
import { FindAllAttribute } from './domain/find-all-attribute';
import { CreateAttributeDto } from './dto/create-attribute.dto';
import { UpdateAttributeDto } from './dto/update-attribute.dto';
import { QueryAttributeDto } from './dto/query-attribute.dto';
import { BaseAttributeRepository } from './persistence/repositories/base-attribute.repository';
import { AttributeRepository } from './persistence/repositories/attribute.repository';
import { User } from '@/users/domain/user';

@Injectable()
export class AttributesService {
  constructor(
    private readonly attributeRepository: BaseAttributeRepository,
    private readonly concreteAttributeRepository: AttributeRepository,
  ) {}

  async create(
    createAttributeDto: CreateAttributeDto,
    causer: User,
  ): Promise<Attribute> {
    const attribute = {
      ...createAttributeDto,
      seller_id: causer.seller_id,
      created_by: causer,
      updated_by: causer,
    };
    return this.attributeRepository.create(attribute as CreateAttributeDto);
  }

  async findAll(
    query: QueryAttributeDto,
    causer: User,
  ): Promise<FindAllAttribute> {
    return this.attributeRepository.findAll(query, causer.seller_id);
  }

  async findById(id: number, causer: User): Promise<Attribute> {
    const attribute = await this.attributeRepository.findById(id);
    if (!attribute) {
      throw new NotFoundException(`Attribute with ID ${id} not found`);
    }
    if (attribute.seller_id !== causer.seller_id) {
      throw new NotFoundException(`Attribute with ID ${id} not found`);
    }
    return attribute;
  }

  async update(
    id: number,
    updateAttributeDto: UpdateAttributeDto,
    causer: User,
  ): Promise<Attribute> {
    await this.findById(id, causer); // Ensure attribute exists and user owns it
    const attribute = {
      ...updateAttributeDto,
      updated_by: causer,
    };
    return this.attributeRepository.update(id, attribute);
  }

  async delete(id: number, causer: User): Promise<void> {
    await this.findById(id, causer); // Ensure attribute exists and user owns it

    // Check for product dependencies before deletion
    const productCount =
      await this.concreteAttributeRepository.countProductsByAttributeId(id);
    if (productCount > 0) {
      throw new ConflictException(
        `Cannot delete attribute: it has ${productCount} product(s) linked to it`,
      );
    }

    const deleteData: UpdateAttributeDto = {
      deleted_by: causer,
    };
    await this.attributeRepository.update(id, deleteData);
    await this.attributeRepository.remove(id);
  }

  async bulkDelete(
    ids: number[],
    causer: User,
  ): Promise<{
    message: string;
    deleted_count: number;
    failed: { id: number; reason: string }[];
  }> {
    if (!ids || ids.length === 0) {
      throw new BadRequestException('No attribute IDs provided');
    }

    if (ids.length > 100) {
      throw new BadRequestException(
        'Maximum 100 attributes can be deleted in bulk operation',
      );
    }

    const failed: { id: number; reason: string }[] = [];
    const toDelete: number[] = [];

    for (const id of ids) {
      try {
        const attribute = await this.attributeRepository.findById(id);

        if (!attribute) {
          failed.push({ id, reason: 'Attribute not found' });
          continue;
        }

        if (attribute.seller_id !== causer.seller_id) {
          failed.push({ id, reason: 'Not your attribute' });
          continue;
        }

        const productCount =
          await this.concreteAttributeRepository.countProductsByAttributeId(id);
        if (productCount > 0) {
          failed.push({ id, reason: `Used by ${productCount} product(s)` });
          continue;
        }

        toDelete.push(id);
      } catch {
        failed.push({ id, reason: 'Error checking attribute' });
      }
    }

    let deletedCount = 0;
    if (toDelete.length > 0) {
      deletedCount = await this.concreteAttributeRepository.bulkSoftDelete(
        toDelete,
        causer.id,
      );
    }

    return {
      message: `${deletedCount} attributes deleted successfully`,
      deleted_count: deletedCount,
      failed,
    };
  }
}
