import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AttributeValueEntity } from '@/attribute-values/persistence/entities/attribute-value.entity';
import { AttributeEntity } from '@/attributes/persistence/entities/attribute.entity';
import { UserEntity } from '@/users/persistence/entities/user.entity';

@Injectable()
export class AttributeValueSeedService {
  constructor(
    @InjectRepository(AttributeEntity)
    private attributeRepository: Repository<AttributeEntity>,
    @InjectRepository(AttributeValueEntity)
    private repository: Repository<AttributeValueEntity>,
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
        '❌ No user found. Cannot proceed to seed attribute values.',
      );
      return;
    }
    if (!seller2User) {
      console.error(
        '❌ No user found. Cannot proceed to seed attribute values.',
      );
      return;
    }
    const attributes = await this.attributeRepository.find();
    if (attributes.length === 0) {
      console.error(
        '❌ No attributes found. Cannot proceed to seed attribute values.',
      );
      return;
    }
    const existingAttributeValues = await this.repository.find();
    const existingKeySet = new Set<string>();
    existingAttributeValues.forEach((av) => {
      existingKeySet.add(`${av.attribute_id}-${av.value.toLowerCase()}`);
    });
    const attributeMap = new Map<string, AttributeEntity>();
    attributes.forEach((attr) => {
      const key = `${attr.seller_id}-${attr.name.toLowerCase()}`;
      attributeMap.set(key, attr);
    });
    const actorUserByAttributeId = new Map<number, UserEntity>();
    attributes.forEach((attr) => {
      const actorUser = attr.seller_id === 2 ? seller2User : user;
      actorUserByAttributeId.set(attr.id, actorUser);
    });
    const attributeValues: Partial<AttributeValueEntity>[] = [];
    const pushMissingAttributeValue = (input: {
      readonly attribute_id: number;
      readonly value: string;
      readonly display_order: number;
    }): void => {
      const key = `${input.attribute_id}-${input.value.toLowerCase()}`;
      if (existingKeySet.has(key)) {
        return;
      }
      const actorUser = actorUserByAttributeId.get(input.attribute_id) ?? user;
      attributeValues.push({
        attribute_id: input.attribute_id,
        value: input.value,
        display_order: input.display_order,
        created_by: actorUser,
        updated_by: actorUser,
      });
    };
    {
      // Size values (TechStore)
      const techStoreSizeAttr = attributeMap.get('1-size');
      if (techStoreSizeAttr) {
        const sizeValues = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
        const actorUser =
          actorUserByAttributeId.get(techStoreSizeAttr.id) ?? user;
        sizeValues.forEach((value, index) => {
          attributeValues.push({
            attribute_id: techStoreSizeAttr.id,
            value,
            display_order: index,
            created_by: actorUser,
            updated_by: actorUser,
          });
        });
      }

      const techStoreGenreAttr = attributeMap.get('1-genre');
      if (techStoreGenreAttr) {
        const genreValues = ['Fiction', 'Mystery', 'Romance'];
        genreValues.forEach((value, index) => {
          pushMissingAttributeValue({
            attribute_id: techStoreGenreAttr.id,
            value,
            display_order: index,
          });
        });
      }

      // Color values (TechStore)
      const techStoreColorAttr = attributeMap.get('1-color');
      if (techStoreColorAttr) {
        const colorValues = [
          'Black',
          'White',
          'Red',
          'Blue',
          'Green',
          'Yellow',
          'Orange',
          'Purple',
          'Pink',
          'Gray',
          'Brown',
          'Silver',
          'Gold',
          'Space Gray',
          'Beige',
          'Navy',
          'Multi-color',
        ];
        const actorUser =
          actorUserByAttributeId.get(techStoreColorAttr.id) ?? user;
        colorValues.forEach((value, index) => {
          attributeValues.push({
            attribute_id: techStoreColorAttr.id,
            value,
            display_order: index,
            created_by: actorUser,
            updated_by: actorUser,
          });
        });
      }

      // Storage values (TechStore)
      const techStoreStorageAttr = attributeMap.get('1-storage');
      if (techStoreStorageAttr) {
        const storageValues = [
          '64GB',
          '128GB',
          '256GB',
          '512GB',
          '1TB',
          '2TB',
          '4TB',
        ];
        storageValues.forEach((value, index) => {
          attributeValues.push({
            attribute_id: techStoreStorageAttr.id,
            value,
            display_order: index,
            created_by: user,
            updated_by: user,
          });
        });
      }

      // Connectivity values (TechStore)
      const techStoreConnectivityAttr = attributeMap.get('1-connectivity');
      if (techStoreConnectivityAttr) {
        const connectivityValues = [
          'Wi-Fi',
          'Cellular',
          'Bluetooth',
          '5G',
          'LTE',
        ];
        connectivityValues.forEach((value, index) => {
          attributeValues.push({
            attribute_id: techStoreConnectivityAttr.id,
            value,
            display_order: index,
            created_by: user,
            updated_by: user,
          });
        });
      }

      // Display Size values (TechStore)
      const techStoreDisplayAttr = attributeMap.get('1-screen size');
      if (techStoreDisplayAttr) {
        const displayValues = [
          '11"',
          '13"',
          '14"',
          '15"',
          '16"',
          '17"',
          '24"',
          '27"',
          '32"',
        ];
        displayValues.forEach((value, index) => {
          pushMissingAttributeValue({
            attribute_id: techStoreDisplayAttr.id,
            value,
            display_order: index,
          });
        });
      }

      // Processor values (TechStore)
      const techStoreProcessorAttr = attributeMap.get('1-processor');
      if (techStoreProcessorAttr) {
        const processorValues = [
          'Intel i3',
          'Intel i5',
          'Intel i7',
          'Intel i9',
          'Apple M1',
          'Apple M2',
          'Apple M3',
          'AMD Ryzen 3',
          'AMD Ryzen 5',
          'AMD Ryzen 7',
          'AMD Ryzen 9',
        ];
        processorValues.forEach((value, index) => {
          attributeValues.push({
            attribute_id: techStoreProcessorAttr.id,
            value,
            display_order: index,
            created_by: user,
            updated_by: user,
          });
        });
      }

      // RAM values (TechStore)
      const techStoreRAMAttr = attributeMap.get('1-ram');
      if (techStoreRAMAttr) {
        const ramValues = ['4GB', '8GB', '16GB', '32GB', '64GB', '128GB'];
        ramValues.forEach((value, index) => {
          attributeValues.push({
            attribute_id: techStoreRAMAttr.id,
            value,
            display_order: index,
            created_by: user,
            updated_by: user,
          });
        });
      }

      // Size values (FashionHub)
      const fashionHubSizeAttr = attributeMap.get('2-size');
      if (fashionHubSizeAttr) {
        const sizeValues = [
          'XS',
          'S',
          'M',
          'L',
          'XL',
          'XXL',
          '3XL',
          '4XL',
          '5XL',
        ];
        const actorUser =
          actorUserByAttributeId.get(fashionHubSizeAttr.id) ?? user;
        sizeValues.forEach((value, index) => {
          attributeValues.push({
            attribute_id: fashionHubSizeAttr.id,
            value,
            display_order: index,
            created_by: actorUser,
            updated_by: actorUser,
          });
        });
      }

      // Color values (FashionHub)
      const fashionHubColorAttr = attributeMap.get('2-color');
      if (fashionHubColorAttr) {
        const colorValues = [
          'Black',
          'White',
          'Red',
          'Blue',
          'Green',
          'Yellow',
          'Orange',
          'Purple',
          'Pink',
          'Gray',
          'Brown',
          'Beige',
          'Navy',
          'Burgundy',
          'Teal',
          'Magenta',
          'Multi-color',
        ];
        const actorUser =
          actorUserByAttributeId.get(fashionHubColorAttr.id) ?? user;
        colorValues.forEach((value, index) => {
          attributeValues.push({
            attribute_id: fashionHubColorAttr.id,
            value,
            display_order: index,
            created_by: actorUser,
            updated_by: actorUser,
          });
        });
      }

      // Material values (FashionHub)
      const fashionHubMaterialAttr = attributeMap.get('2-material');
      if (fashionHubMaterialAttr) {
        const materialValues = [
          'Cotton',
          'Polyester',
          'Wool',
          'Silk',
          'Linen',
          'Denim',
          'Leather',
          'Nylon',
          'Spandex',
          'Rayon',
          'Velvet',
          'Suede',
        ];
        const actorUser =
          actorUserByAttributeId.get(fashionHubMaterialAttr.id) ?? user;
        materialValues.forEach((value, index) => {
          attributeValues.push({
            attribute_id: fashionHubMaterialAttr.id,
            value,
            display_order: index,
            created_by: actorUser,
            updated_by: actorUser,
          });
        });
      }

      // Fit values (FashionHub)
      const fashionHubFitAttr = attributeMap.get('2-fit');
      if (fashionHubFitAttr) {
        const fitValues = [
          'Slim',
          'Regular',
          'Relaxed',
          'Loose',
          'Athletic',
          'Comfort',
          'Classic',
          'Modern',
        ];
        const actorUser =
          actorUserByAttributeId.get(fashionHubFitAttr.id) ?? user;
        fitValues.forEach((value, index) => {
          attributeValues.push({
            attribute_id: fashionHubFitAttr.id,
            value,
            display_order: index,
            created_by: actorUser,
            updated_by: actorUser,
          });
        });
      }

      // Roast Level values (TechStore)
      const techStoreRoastAttr = attributeMap.get('1-roast level');
      if (techStoreRoastAttr) {
        const roastValues = [
          'Light Roast',
          'Medium Roast',
          'Medium-Dark Roast',
          'Dark Roast',
          'French Roast',
          'Italian Roast',
        ];
        const actorUser =
          actorUserByAttributeId.get(techStoreRoastAttr.id) ?? user;
        roastValues.forEach((value, index) => {
          attributeValues.push({
            attribute_id: techStoreRoastAttr.id,
            value,
            display_order: index,
            created_by: actorUser,
            updated_by: actorUser,
          });
        });
      }

      // Grind Size values (TechStore)
      const techStoreGrindAttr = attributeMap.get('1-grind type');
      if (techStoreGrindAttr) {
        const grindValues = [
          'Whole Bean',
          'Extra Fine',
          'Fine Grind',
          'Medium Grind',
          'Coarse Grind',
          'Extra Coarse',
          'Espresso Grind',
        ];
        grindValues.forEach((value, index) => {
          pushMissingAttributeValue({
            attribute_id: techStoreGrindAttr.id,
            value,
            display_order: index,
          });
        });
      }

      const seller1MaterialAttr = attributeMap.get('1-material');
      if (seller1MaterialAttr) {
        const materialValues = [
          'Stainless Steel',
          'Glass',
          'Ceramic',
          'Bamboo',
          'Wood',
          'Plastic',
          'Fabric',
          'Leather',
          'Maple',
          'Oak',
          'Walnut',
          'Cherry',
          'Organic Cocoa',
        ];
        materialValues.forEach((value, index) => {
          pushMissingAttributeValue({
            attribute_id: seller1MaterialAttr.id,
            value,
            display_order: index,
          });
        });
      }

      const seller1StyleAttr = attributeMap.get('1-style');
      if (seller1StyleAttr) {
        const styleValues = ['Modern', 'Classic', 'Minimalist'];
        styleValues.forEach((value, index) => {
          pushMissingAttributeValue({
            attribute_id: seller1StyleAttr.id,
            value,
            display_order: index,
          });
        });
      }

      const seller2StyleAttr = attributeMap.get('2-style');
      if (seller2StyleAttr) {
        const styleValues = ['Regular', 'Slim', 'Classic', 'Modern'];
        styleValues.forEach((value, index) => {
          pushMissingAttributeValue({
            attribute_id: seller2StyleAttr.id,
            value,
            display_order: index,
          });
        });
      }

      const seller1BladeCountAttr = attributeMap.get('1-blade count');
      if (seller1BladeCountAttr) {
        const values = ['6'];
        values.forEach((value, index) => {
          pushMissingAttributeValue({
            attribute_id: seller1BladeCountAttr.id,
            value,
            display_order: index,
          });
        });
      }

      const seller1CocoaPercentageAttr = attributeMap.get('1-cocoa percentage');
      if (seller1CocoaPercentageAttr) {
        const values = ['70%', '85%', '90%'];
        values.forEach((value, index) => {
          pushMissingAttributeValue({
            attribute_id: seller1CocoaPercentageAttr.id,
            value,
            display_order: index,
          });
        });
      }

      const seller1SteepTimeAttr = attributeMap.get('1-steep time');
      if (seller1SteepTimeAttr) {
        const values = ['2-3 min', '3-5 min'];
        values.forEach((value, index) => {
          pushMissingAttributeValue({
            attribute_id: seller1SteepTimeAttr.id,
            value,
            display_order: index,
          });
        });
      }

      const seller1BookCountAttr = attributeMap.get('1-book count');
      if (seller1BookCountAttr) {
        const values = ['3', '5'];
        values.forEach((value, index) => {
          pushMissingAttributeValue({
            attribute_id: seller1BookCountAttr.id,
            value,
            display_order: index,
          });
        });
      }

      const seller1StringTypeAttr = attributeMap.get('1-string type');
      if (seller1StringTypeAttr) {
        const values = ['Steel', 'Nylon'];
        values.forEach((value, index) => {
          pushMissingAttributeValue({
            attribute_id: seller1StringTypeAttr.id,
            value,
            display_order: index,
          });
        });
      }

      const seller1WoodTypeAttr = attributeMap.get('1-wood type');
      if (seller1WoodTypeAttr) {
        const values = ['Mahogany', 'Spruce'];
        values.forEach((value, index) => {
          pushMissingAttributeValue({
            attribute_id: seller1WoodTypeAttr.id,
            value,
            display_order: index,
          });
        });
      }

      const seller1MetalTypeAttr = attributeMap.get('1-metal type');
      if (seller1MetalTypeAttr) {
        const values = ['Silver'];
        values.forEach((value, index) => {
          pushMissingAttributeValue({
            attribute_id: seller1MetalTypeAttr.id,
            value,
            display_order: index,
          });
        });
      }

      const seller1GemstoneAttr = attributeMap.get('1-gemstone');
      if (seller1GemstoneAttr) {
        const values = ['Amethyst', 'Turquoise', 'Rose Quartz'];
        values.forEach((value, index) => {
          pushMissingAttributeValue({
            attribute_id: seller1GemstoneAttr.id,
            value,
            display_order: index,
          });
        });
      }

      const seller1OrganicCertifiedAttr = attributeMap.get(
        '1-organic certified',
      );
      if (seller1OrganicCertifiedAttr) {
        const values = ['Yes', 'No'];
        values.forEach((value, index) => {
          pushMissingAttributeValue({
            attribute_id: seller1OrganicCertifiedAttr.id,
            value,
            display_order: index,
          });
        });
      }

      const seller1FreshnessAttr = attributeMap.get('1-freshness');
      if (seller1FreshnessAttr) {
        const values = ['Fresh'];
        values.forEach((value, index) => {
          pushMissingAttributeValue({
            attribute_id: seller1FreshnessAttr.id,
            value,
            display_order: index,
          });
        });
      }

      const seller1CustomizationTypeAttr = attributeMap.get(
        '1-customization type',
      );
      if (seller1CustomizationTypeAttr) {
        const values = ['Photo Print', 'Engraving'];
        values.forEach((value, index) => {
          pushMissingAttributeValue({
            attribute_id: seller1CustomizationTypeAttr.id,
            value,
            display_order: index,
          });
        });
      }

      const seller1CanvasSizeAttr = attributeMap.get('1-canvas size');
      if (seller1CanvasSizeAttr) {
        const values = ['11"x14"', '16"x20"', '24"x36"'];
        values.forEach((value, index) => {
          pushMissingAttributeValue({
            attribute_id: seller1CanvasSizeAttr.id,
            value,
            display_order: index,
          });
        });
      }

      const seller2CapacityAttr = attributeMap.get('2-capacity');
      if (seller2CapacityAttr) {
        const values = ['4 Person'];
        values.forEach((value, index) => {
          pushMissingAttributeValue({
            attribute_id: seller2CapacityAttr.id,
            value,
            display_order: index,
          });
        });
      }

      const seller2ThicknessAttr = attributeMap.get('2-thickness');
      if (seller2ThicknessAttr) {
        const values = ['6mm', '8mm'];
        values.forEach((value, index) => {
          pushMissingAttributeValue({
            attribute_id: seller2ThicknessAttr.id,
            value,
            display_order: index,
          });
        });
      }

      const seller2LengthAttr = attributeMap.get('2-length');
      if (seller2LengthAttr) {
        const values = ['183cm', '188cm'];
        values.forEach((value, index) => {
          pushMissingAttributeValue({
            attribute_id: seller2LengthAttr.id,
            value,
            display_order: index,
          });
        });
      }

      const seller2WaterproofAttr = attributeMap.get('2-waterproof rating');
      if (seller2WaterproofAttr) {
        const values = ['2000mm', '3000mm'];
        values.forEach((value, index) => {
          pushMissingAttributeValue({
            attribute_id: seller2WaterproofAttr.id,
            value,
            display_order: index,
          });
        });
      }

      const seller2SkinTypeAttr = attributeMap.get('2-skin type');
      if (seller2SkinTypeAttr) {
        const values = ['Normal', 'Dry', 'Oily'];
        values.forEach((value, index) => {
          pushMissingAttributeValue({
            attribute_id: seller2SkinTypeAttr.id,
            value,
            display_order: index,
          });
        });
      }

      const seller2FragranceAttr = attributeMap.get('2-fragrance');
      if (seller2FragranceAttr) {
        const values = ['Unscented', 'Lavender'];
        values.forEach((value, index) => {
          pushMissingAttributeValue({
            attribute_id: seller2FragranceAttr.id,
            value,
            display_order: index,
          });
        });
      }

      const seller1VolumeAttr = attributeMap.get('1-volume');
      if (seller1VolumeAttr) {
        const volumeValues = [
          '250ml',
          '350ml',
          '500ml',
          '750ml',
          '1L',
          '12oz',
          '16oz',
          '20oz',
        ];
        volumeValues.forEach((value, index) => {
          pushMissingAttributeValue({
            attribute_id: seller1VolumeAttr.id,
            value,
            display_order: index,
          });
        });
      }

      const seller1WeightAttr = attributeMap.get('1-weight');
      if (seller1WeightAttr) {
        const weightValues = ['50g', '200g', '250g', '1kg'];
        weightValues.forEach((value, index) => {
          pushMissingAttributeValue({
            attribute_id: seller1WeightAttr.id,
            value,
            display_order: index,
          });
        });
      }

      const seller1PowerAttr = attributeMap.get('1-power');
      if (seller1PowerAttr) {
        const powerValues = ['Battery', 'USB', 'AC'];
        powerValues.forEach((value, index) => {
          pushMissingAttributeValue({
            attribute_id: seller1PowerAttr.id,
            value,
            display_order: index,
          });
        });
      }

      const fashionHubQuantityAttr = attributeMap.get('2-quantity');
      if (fashionHubQuantityAttr) {
        const quantityValues = ['4 Pack', '6 Pack'];
        quantityValues.forEach((value, index) => {
          pushMissingAttributeValue({
            attribute_id: fashionHubQuantityAttr.id,
            value,
            display_order: index,
          });
        });
      }

      // Grade values (TechStore)
      const techStoreGradeAttr = attributeMap.get('1-grade');
      if (techStoreGradeAttr) {
        const gradeValues = [
          'Premium Grade',
          'Standard Grade',
          'Economy Grade',
          'Organic Grade',
          'Fair Trade Grade',
          'Specialty Grade',
        ];
        gradeValues.forEach((value, index) => {
          attributeValues.push({
            attribute_id: techStoreGradeAttr.id,
            value,
            display_order: index,
            created_by: user,
            updated_by: user,
          });
        });
      }

      // Flavor Profile values (TechStore)
      const techStoreFlavorAttr = attributeMap.get('1-flavor profile');
      if (techStoreFlavorAttr) {
        const flavorValues = [
          'Fruity',
          'Nutty',
          'Chocolatey',
          'Spicy',
          'Floral',
          'Earthy',
          'Sweet',
          'Bitter',
          'Smoky',
          'Citrus',
        ];
        flavorValues.forEach((value, index) => {
          attributeValues.push({
            attribute_id: techStoreFlavorAttr.id,
            value,
            display_order: index,
            created_by: user,
            updated_by: user,
          });
        });
      }

      // Origin values (TechStore)
      const techStoreOriginAttr = attributeMap.get('1-origin');
      if (techStoreOriginAttr) {
        const originValues = [
          'Colombian',
          'Ethiopian',
          'Brazilian',
          'Jamaican',
          'Costa Rican',
          'Guatemalan',
          'Kenyan',
          'Hawaiian',
          'Indian',
          'Peruvian',
        ];
        originValues.forEach((value, index) => {
          attributeValues.push({
            attribute_id: techStoreOriginAttr.id,
            value,
            display_order: index,
            created_by: user,
            updated_by: user,
          });
        });
      }

      // Tea Type values (TechStore)
      const techStoreTeaTypeAttr = attributeMap.get('1-tea type');
      if (techStoreTeaTypeAttr) {
        const teaTypeValues = [
          'Green Tea',
          'Black Tea',
          'White Tea',
          'Oolong Tea',
          'Pu-erh Tea',
          'Herbal Tea',
          'Rooibos Tea',
        ];
        teaTypeValues.forEach((value, index) => {
          attributeValues.push({
            attribute_id: techStoreTeaTypeAttr.id,
            value,
            display_order: index,
            created_by: user,
            updated_by: user,
          });
        });
      }

      // Tea Grade values (TechStore)
      const techStoreTeaGradeAttr = attributeMap.get('1-tea grade');
      if (techStoreTeaGradeAttr) {
        const teaGradeValues = [
          'Premium Grade',
          'Standard Grade',
          'Economy Grade',
          'Organic Grade',
          'Ceremonial Grade',
          'Garden Grade',
        ];
        teaGradeValues.forEach((value, index) => {
          attributeValues.push({
            attribute_id: techStoreTeaGradeAttr.id,
            value,
            display_order: index,
            created_by: user,
            updated_by: user,
          });
        });
      }

      // Processing Method values (TechStore)
      const techStoreProcessingAttr = attributeMap.get('1-processing method');
      if (techStoreProcessingAttr) {
        const processingValues = [
          'Pan-fired',
          'Steamed',
          'Sun-dried',
          'Shade-grown',
          'Withered',
          'Rolled',
          'Fermented',
          'Oxidized',
        ];
        processingValues.forEach((value, index) => {
          attributeValues.push({
            attribute_id: techStoreProcessingAttr.id,
            value,
            display_order: index,
            created_by: user,
            updated_by: user,
          });
        });
      }
    }
    const newKeySet = new Set<string>();
    const uniqueAttributeValues = attributeValues.filter((av) => {
      const value: string = (av.value ?? '').toString();
      const key = `${av.attribute_id}-${value.toLowerCase()}`;
      if (existingKeySet.has(key) || newKeySet.has(key)) {
        return false;
      }
      newKeySet.add(key);
      return true;
    });
    console.log(
      `💾 Attempting to save ${uniqueAttributeValues.length} attribute values...`,
    );
    for (const attributeValue of uniqueAttributeValues) {
      try {
        await this.repository.save(attributeValue);
      } catch (error) {
        console.error(`❌ Failed to save attribute value:`, error);
      }
    }
    const finalCount = await this.repository.count();
    console.log(`📊 Final attribute value count: ${finalCount}`);
    console.log(
      `✅ Attribute values seed completed (${uniqueAttributeValues.length} inserted)`,
    );
  }
}
