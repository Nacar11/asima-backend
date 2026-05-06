import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { BaseProductAttributeValueRepository } from './persistence/repositories/base-product-attribute-value.repository';
import { ProductAttributeValue } from './domain/product-attribute-value';
import { FindAllProductAttributeValue } from './domain/find-all-product-attribute-value';
import { QueryProductAttributeValueDto } from './dto/query-product-attribute-value.dto';

/**
 * Service for ProductAttributeValue business logic
 */
@Injectable()
export class ProductAttributeValuesService {
  constructor(
    private readonly repository: BaseProductAttributeValueRepository,
  ) {}

  async findAll(
    query: QueryProductAttributeValueDto,
  ): Promise<FindAllProductAttributeValue> {
    return this.repository.findAll(query);
  }

  async findById(id: number): Promise<ProductAttributeValue> {
    const result = await this.repository.findById(id);
    if (!result) {
      throw new NotFoundException(
        `ProductAttributeValue with ID ${id} not found`,
      );
    }
    return result;
  }

  /**
   * Sets the specified product attribute value as the default within its group.
   * All other instances with the same product_attribute_id will be set to non-default.
   */
  async setDefault(id: number): Promise<ProductAttributeValue> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundException(
        `ProductAttributeValue with ID ${id} not found`,
      );
    }
    const updated = await this.repository.setDefault(
      id,
      existing.product_attribute_id,
    );
    return updated;
  }

  /**
   * Bulk sets multiple product attribute values as defaults.
   * Each ID must belong to a different product_attribute_id group.
   * For each group, clears existing is_default=true, then sets the requested ID.
   */
  async bulkSetDefault(ids: number[]): Promise<ProductAttributeValue[]> {
    if (ids.length === 0) {
      return [];
    }
    const records = await this.repository.findByIds(ids);
    if (records.length !== ids.length) {
      const foundIds = records.map((r) => r.id);
      const missingIds = ids.filter((id) => !foundIds.includes(id));
      throw new NotFoundException(
        `ProductAttributeValue(s) not found: ${missingIds.join(', ')}`,
      );
    }
    const groupMap = new Map<number, number[]>();
    for (const record of records) {
      const groupId = record.product_attribute_id;
      const existing = groupMap.get(groupId) ?? [];
      existing.push(record.id);
      groupMap.set(groupId, existing);
    }
    const duplicateGroups: string[] = [];
    groupMap.forEach((idsInGroup, groupId) => {
      if (idsInGroup.length > 1) {
        duplicateGroups.push(
          `product_attribute_id=${groupId} has IDs: [${idsInGroup.join(', ')}]`,
        );
      }
    });
    if (duplicateGroups.length > 0) {
      throw new BadRequestException(
        `Multiple IDs belong to the same group: ${duplicateGroups.join('; ')}`,
      );
    }
    const idsWithGroups = records.map((r) => ({
      id: r.id,
      productAttributeId: r.product_attribute_id,
    }));
    return this.repository.bulkSetDefault(idsWithGroups);
  }
}
