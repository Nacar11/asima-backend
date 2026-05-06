import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductAttributeValueEntity } from '@/product-attribute-values/persistence/entities/product-attribute-value.entity';
import { ProductVariantEntity } from '@/product-variants/persistence/entities/product-variant.entity';
import { ProductAttributeEntity } from '@/product-attributes/persistence/entities/product-attribute.entity';
import { AttributeValueEntity } from '@/attribute-values/persistence/entities/attribute-value.entity';
import { UserEntity } from '@/users/persistence/entities/user.entity';

@Injectable()
export class ProductAttributeValueSeedService {
  constructor(
    @InjectRepository(ProductVariantEntity)
    private productVariantRepository: Repository<ProductVariantEntity>,
    @InjectRepository(ProductAttributeEntity)
    private productAttributeRepository: Repository<ProductAttributeEntity>,
    @InjectRepository(AttributeValueEntity)
    private attributeValueRepository: Repository<AttributeValueEntity>,
    @InjectRepository(ProductAttributeValueEntity)
    private repository: Repository<ProductAttributeValueEntity>,
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
  ) {}

  async run(): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id: 1 },
    });
    const seller2User = await this.userRepository.findOne({
      where: { id: 2 },
    });
    if (!user) {
      console.error(
        '❌ No user found. Cannot proceed to seed product attribute values.',
      );
      return;
    }
    if (!seller2User) {
      console.error(
        '❌ No user found. Cannot proceed to seed product attribute values.',
      );
      return;
    }
    const productVariants = await this.productVariantRepository.find({
      relations: ['product'],
    });
    const productAttributes = await this.productAttributeRepository.find({
      relations: ['attribute'],
    });
    const attributeValues = await this.attributeValueRepository.find({
      relations: ['attribute'],
    });
    if (productVariants.length === 0) {
      console.error(
        '❌ No product variants found. Cannot proceed to seed product attribute values.',
      );
      return;
    }
    if (productAttributes.length === 0) {
      console.error(
        '❌ No product attributes found. Cannot proceed to seed product attribute values.',
      );
      return;
    }
    if (attributeValues.length === 0) {
      console.error(
        '❌ No attribute values found. Cannot proceed to seed product attribute values.',
      );
      return;
    }
    const actorUserByProductId = new Map<number, UserEntity>();
    for (const variant of productVariants) {
      const sellerId = variant.product?.seller_id;
      const actorUser = sellerId === 2 ? seller2User : user;
      actorUserByProductId.set(variant.product_id, actorUser);
    }
    const existing = await this.repository.find();
    const existingKeySet = new Set<string>();
    for (const pav of existing) {
      existingKeySet.add(
        `${pav.product_variant_id}-${pav.product_attribute_id}`,
      );
    }

    // Fix existing records: ensure each product_attribute has exactly one default value
    const existingByProductAttr = new Map<
      number,
      ProductAttributeValueEntity[]
    >();
    for (const pav of existing) {
      const list = existingByProductAttr.get(pav.product_attribute_id) ?? [];
      list.push(pav);
      existingByProductAttr.set(pav.product_attribute_id, list);
    }

    let defaultsFixed = 0;
    for (const pavList of existingByProductAttr.values()) {
      const hasDefault = pavList.some((pav) => pav.is_default);
      if (!hasDefault && pavList.length > 0) {
        // Set the first one as default
        const firstPav = pavList[0];
        firstPav.is_default = true;
        await this.repository.save(firstPav);
        defaultsFixed++;
      }
    }
    if (defaultsFixed > 0) {
      console.log(
        `✅ Fixed ${defaultsFixed} product attributes with missing defaults`,
      );
    }
    const productAttributesMap = new Map<number, ProductAttributeEntity[]>();
    for (const pa of productAttributes) {
      const list = productAttributesMap.get(pa.product_id) ?? [];
      list.push(pa);
      productAttributesMap.set(pa.product_id, list);
    }
    const attributeValuesById = new Map<number, AttributeValueEntity>();
    for (const av of attributeValues) {
      attributeValuesById.set(av.id, av);
    }
    const attributeValuesMap = new Map<number, AttributeValueEntity[]>();
    for (const av of attributeValues) {
      const list = attributeValuesMap.get(av.attribute_id) ?? [];
      list.push(av);
      attributeValuesMap.set(av.attribute_id, list);
    }
    const newProductAttributeValues: Partial<ProductAttributeValueEntity>[] =
      [];
    // Track which product_attribute_id has already had a default set
    const defaultSetForProductAttribute = new Set<number>();

    for (const variant of productVariants) {
      const actorUser = actorUserByProductId.get(variant.product_id) ?? user;
      const productAttrs = productAttributesMap.get(variant.product_id) ?? [];
      if (!productAttrs.length) {
        continue;
      }
      for (const productAttr of productAttrs) {
        const key = `${variant.id}-${productAttr.id}`;
        if (existingKeySet.has(key)) {
          continue;
        }
        const allowedValueIds = productAttr.attribute_value_ids ?? [];
        const allowedValues: AttributeValueEntity[] = allowedValueIds
          .map((id) => attributeValuesById.get(id))
          .filter((value): value is AttributeValueEntity => Boolean(value));
        const fallbackValues =
          attributeValuesMap.get(productAttr.attribute_id) ?? [];
        const availableValues = allowedValues.length
          ? allowedValues
          : fallbackValues;
        if (!availableValues.length) {
          continue;
        }
        const randomValue =
          availableValues[Math.floor(Math.random() * availableValues.length)];

        // Set is_default to true for the first value of each product attribute
        const isDefault = !defaultSetForProductAttribute.has(productAttr.id);
        if (isDefault) {
          defaultSetForProductAttribute.add(productAttr.id);
        }

        newProductAttributeValues.push({
          product_variant_id: variant.id,
          product_attribute_id: productAttr.id,
          attribute_value_id: randomValue.id,
          is_default: isDefault,
          created_by: actorUser.id,
          updated_by: actorUser.id,
        });
        existingKeySet.add(key);
      }
    }
    for (const pav of newProductAttributeValues) {
      await this.repository.save(pav);
    }
    if (!newProductAttributeValues.length) {
      console.log(
        '⚠️  Product attribute values already exist for all variants, skipping',
      );
      return;
    }
    console.log(
      `✅ Product attribute values seed completed (${newProductAttributeValues.length} inserted)`,
    );
  }
}
