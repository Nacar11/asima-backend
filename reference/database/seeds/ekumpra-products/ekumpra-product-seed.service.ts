import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ISeedService } from '../seed.interface';
import { Repository, DataSource } from 'typeorm';
import bcrypt from 'bcryptjs';
import { ProductEntity } from '@/products/persistence/entities/product.entity';
import { ProductVariantEntity } from '@/product-variants/persistence/entities/product-variant.entity';
import { CategoryEntity } from '@/categories/persistence/entities/category.entity';
import { ProductCategoryEntity } from '@/product-categories/persistence/entities/product-category.entity';
import { ProductAttributeEntity } from '@/product-attributes/persistence/entities/product-attribute.entity';
import { ProductAttributeValueEntity } from '@/product-attribute-values/persistence/entities/product-attribute-value.entity';
import { AttributeEntity } from '@/attributes/persistence/entities/attribute.entity';
import { AttributeValueEntity } from '@/attribute-values/persistence/entities/attribute-value.entity';
import { UserEntity } from '@/users/persistence/entities/user.entity';
import { SellerEntity } from '@/sellers/persistence/entities/seller.entity';
import { MediaEntity } from '@/media/persistence/entities/media.entity';
import { ProductMediaMappingEntity } from '@/media/persistence/entities/product-media-mapping.entity';
import { StorageService } from '@/storage/storage.service';
import { ImageProcessorService } from '@/media/shared/services/image-processor.service';
import { MediaTypeEnum } from '@/media/domain/media-type.enum';
import { ProcessingStatusEnum } from '@/media/domain/processing-status.enum';
import { StatusEnum } from '@/utils/enums/status-enum';
import { ProductFeaturedSectionEntity } from '@/featured-products/persistence/entities/product-featured-section.entity';
import { FeaturedSectionEnum } from '@/products/products.enum';
import { InventoryStockEntity } from '@/inventory-stocks/persistence/entities/inventory-stock.entity';
import { EKUMPRA_PRODUCTS } from './ekumpra-products.data';

@Injectable()
export class EkumpraProductSeedService implements ISeedService {
  // Seed images folder in MinIO bucket
  private readonly SEED_IMAGES_FOLDER = 'seed-images/E-KUMPRA';

  constructor(
    private dataSource: DataSource,
    private storageService: StorageService,
    private imageProcessorService: ImageProcessorService,
    @InjectRepository(UserEntity)
    private userRepo: Repository<UserEntity>,
    @InjectRepository(SellerEntity)
    private sellerRepo: Repository<SellerEntity>,
  ) {}

  async run(): Promise<void> {
    const userEmail = 'mark_saren+dpofoods@cody.inc';

    let user = await this.userRepo.findOne({ where: { email: userEmail } });

    if (!user) {
      console.log(`📝 Creating user: ${userEmail}`);
      const salt = await bcrypt.genSalt();
      const password = await bcrypt.hash('password', salt);

      user = await this.userRepo.save(
        this.userRepo.create({
          user_id: 'DPOFOODS',
          first_name: 'DPO',
          last_name: 'Foods',
          email: userEmail,
          password,
          salt,
          system_admin: false,
        }),
      );
      console.log(`✅ User created: ${userEmail} (ID: ${user.id})`);
    } else {
      console.log(`✅ User found: ${userEmail} (ID: ${user.id})`);
    }

    const storeName = 'DPO Food and Products Trading Inc.';

    let seller = await this.sellerRepo.findOne({
      where: { user_id: user.id },
    });

    if (!seller) {
      console.log(`📝 Creating seller: ${storeName}`);
      const slug = storeName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      seller = await this.sellerRepo.save(
        this.sellerRepo.create({
          user_id: user.id,
          store_name: storeName,
          store_description: 'Supplier of food and products',
          slug: slug,
          is_verified: true,
          is_active: true,
          sells_products: true,
          sells_services: false,
          status: StatusEnum.ACTIVE,
          pickup_address: 'Cebu City',
          pickup_city: 'Cebu City',
          pickup_province: 'Cebu',
          pickup_postal_code: '6000',
          pickup_latitude: 10.3157,
          pickup_longitude: 123.8854,
          created_by: user,
          updated_by: user,
        }),
      );
      console.log(`✅ Seller created: ${storeName} (ID: ${seller.id})`);
    } else {
      console.log(`✅ Seller found: ${seller.store_name} (ID: ${seller.id})`);
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      console.log('📦 Seeding EKUMPRA products...');

      const productRepo = queryRunner.manager.getRepository(ProductEntity);
      const variantRepo =
        queryRunner.manager.getRepository(ProductVariantEntity);
      const categoryRepo = queryRunner.manager.getRepository(CategoryEntity);
      const productCategoryRepo = queryRunner.manager.getRepository(
        ProductCategoryEntity,
      );
      const attributeRepo = queryRunner.manager.getRepository(AttributeEntity);
      const attributeValueRepo =
        queryRunner.manager.getRepository(AttributeValueEntity);
      const productAttributeRepo = queryRunner.manager.getRepository(
        ProductAttributeEntity,
      );
      const productAttributeValueRepo = queryRunner.manager.getRepository(
        ProductAttributeValueEntity,
      );
      const mediaRepo = queryRunner.manager.getRepository(MediaEntity);
      const mediaMappingRepo = queryRunner.manager.getRepository(
        ProductMediaMappingEntity,
      );
      const featuredSectionRepo = queryRunner.manager.getRepository(
        ProductFeaturedSectionEntity,
      );
      const inventoryStockRepo =
        queryRunner.manager.getRepository(InventoryStockEntity);

      const attributeCache = new Map<string, AttributeEntity>();
      const attributeValueCache = new Map<string, AttributeValueEntity>();

      let productsCreated = 0;
      let variantsCreated = 0;
      let variantsSkipped = 0;
      let imagesSeeded = 0;
      let inventoryStocksCreated = 0;

      // Get seller slug for image paths
      const sellerSlug = this.createSlug(seller.store_name);

      for (const productData of EKUMPRA_PRODUCTS) {
        const category = await this.ensureCategory(
          categoryRepo,
          productData.categoryName,
          user,
        );

        let product = await productRepo.findOne({
          where: {
            product_name: productData.productName,
            seller_id: seller.id,
          },
        });

        const isNewProduct = !product;

        if (!product) {
          const validStatuses = ['Published', 'Draft', 'Archived'];
          const status = validStatuses.includes(productData.productStatus)
            ? productData.productStatus
            : 'Published';

          product = await productRepo.save(
            productRepo.create({
              product_name: productData.productName,
              description: productData.productDescription,
              status: status,
              seller_id: seller.id,
              created_by: user,
              updated_by: user,
            }),
          );
          productsCreated++;
        }

        const existingLink = await productCategoryRepo.findOne({
          where: { product_id: product.id, category_id: category.id },
        });
        if (!existingLink) {
          await productCategoryRepo.save(
            productCategoryRepo.create({
              product_id: product.id,
              category_id: category.id,
              created_by: user,
              updated_by: user,
            }),
          );
        }

        const productAttributeNames = new Set<string>();
        for (const variant of productData.variants) {
          for (const attr of variant.attributes) {
            productAttributeNames.add(attr.name);
          }
        }

        const productAttributeMap = new Map<string, ProductAttributeEntity>();
        const attributeValueIdsMap = new Map<string, Set<number>>();

        for (const attrName of productAttributeNames) {
          const attribute = await this.ensureAttribute(
            attributeRepo,
            attributeCache,
            attrName,
            seller.id,
            user,
          );

          let productAttribute = await productAttributeRepo.findOne({
            where: { product_id: product.id, attribute_id: attribute.id },
          });

          if (!productAttribute) {
            productAttribute = await productAttributeRepo.save(
              productAttributeRepo.create({
                product_id: product.id,
                attribute_id: attribute.id,
                attribute_value_ids: [],
                created_by: user,
                updated_by: user,
              }),
            );
          }

          productAttributeMap.set(attrName, productAttribute);
          attributeValueIdsMap.set(
            attrName,
            new Set(productAttribute.attribute_value_ids || []),
          );
        }

        for (const variantData of productData.variants) {
          const existingVariant = await variantRepo.findOne({
            where: { sku: variantData.variantSku },
          });

          if (existingVariant) {
            variantsSkipped++;
            continue;
          }

          const variantStatus: 'Active' | 'Inactive' =
            variantData.variantStatus === 'Active' ? 'Active' : 'Inactive';

          const variant = await variantRepo.save(
            variantRepo.create({
              product_id: product.id,
              sku: variantData.variantSku,
              variant_name: variantData.variantName,
              description: variantData.variantDescription,
              cost_price: variantData.variantCostPrice,
              selling_price: variantData.variantSellingPrice,
              minimum_order: variantData.variantMinimumOrder,
              status: variantStatus,
              created_by: user,
              updated_by: user,
            }),
          );
          variantsCreated++;

          // Create inventory stock for the variant
          // TODO: Remove if for PRODUCTION
          const existingStock = await inventoryStockRepo.findOne({
            where: { variant_id: variant.id },
          });

          if (!existingStock) {
            await inventoryStockRepo.save(
              inventoryStockRepo.create({
                variant_id: variant.id,
                stock_on_hand: 10,
                stock_quantity: 10,
                reserved_quantity: 0,
                available_quantity: 10,
                min_stock_level: 0,
                last_counted_at: new Date(),
                created_by: user,
                updated_by: user,
              }),
            );
            inventoryStocksCreated++;
          }

          // Seed variant image from MinIO seed-images folder
          const variantMedia = await this.seedVariantImage(
            variantData.variantName,
            variantData.variantSku,
            productData.productName,
            productData.categoryName,
            seller.id,
            sellerSlug,
            user.id,
            mediaRepo,
          );

          if (variantMedia) {
            // Update variant with media_id
            await variantRepo.update(variant.id, { media_id: variantMedia.id });
            imagesSeeded++;

            // Check if product already has a featured image
            const existingFeaturedImage = await mediaMappingRepo.findOne({
              where: { product_id: product.id, is_primary: true },
            });

            if (!existingFeaturedImage) {
              // First variant's image becomes the featured image
              await this.createProductMediaMapping(
                product.id,
                variantMedia.id,
                user.id,
                true,
                mediaMappingRepo,
              );
            } else {
              // Add as product gallery image (non-featured)
              await this.createProductMediaMapping(
                product.id,
                variantMedia.id,
                user.id,
                false,
                mediaMappingRepo,
              );
            }
          }

          for (const attr of variantData.attributes) {
            const productAttribute = productAttributeMap.get(attr.name);
            if (!productAttribute) continue;

            const attributeValue = await this.ensureAttributeValue(
              attributeValueRepo,
              attributeValueCache,
              productAttribute.attribute_id,
              attr.value,
              user,
            );

            attributeValueIdsMap.get(attr.name)?.add(attributeValue.id);

            const existingPav = await productAttributeValueRepo.findOne({
              where: {
                product_variant_id: variant.id,
                product_attribute_id: productAttribute.id,
              },
            });

            if (!existingPav) {
              await productAttributeValueRepo.save(
                productAttributeValueRepo.create({
                  product_variant_id: variant.id,
                  product_attribute_id: productAttribute.id,
                  attribute_value_id: attributeValue.id,
                  is_default: false,
                  created_by: user.id,
                  updated_by: user.id,
                }),
              );
            }
          }
        }

        for (const [attrName, productAttribute] of productAttributeMap) {
          const valueIds = Array.from(attributeValueIdsMap.get(attrName) || []);
          if (valueIds.length > 0) {
            await productAttributeRepo.update(productAttribute.id, {
              attribute_value_ids: valueIds,
            });
          }
        }

        const status = isNewProduct ? '✅ Created' : '🔄 Updated';
        console.log(
          `  ${status}: ${productData.productName} (${productData.variants.length} variants)`,
        );
      }

      // Add featured products
      console.log('⭐ Adding featured products...');
      const featuredProductNames = ['Powder', 'Cake', 'Syrup', 'Cup PET'];
      let featuredCount = 0;

      for (let i = 0; i < featuredProductNames.length; i++) {
        const productName = featuredProductNames[i];
        const product = await productRepo.findOne({
          where: {
            product_name: productName,
            seller_id: seller.id,
          },
        });

        if (product) {
          const existingFeatured = await featuredSectionRepo.findOne({
            where: {
              product_id: product.id,
              section: FeaturedSectionEnum.FEATURED,
            },
          });

          if (!existingFeatured) {
            await featuredSectionRepo.save(
              featuredSectionRepo.create({
                product_id: product.id,
                section: FeaturedSectionEnum.FEATURED,
                display_order: i,
                featured_at: new Date(),
                featured_by: user,
              }),
            );
            featuredCount++;
            console.log(`  ⭐ Featured: ${productName}`);
          } else {
            console.log(`  ⏭️  Already featured: ${productName}`);
          }
        } else {
          console.log(`  ⚠️  Product not found: ${productName}`);
        }
      }

      await queryRunner.commitTransaction();
      console.log(
        `✅ E-KUMPRA seed completed: ${productsCreated} products, ${variantsCreated} variants created, ${variantsSkipped} skipped, ${imagesSeeded} images seeded, ${inventoryStocksCreated} inventory stocks created, ${featuredCount} featured products added`,
      );
    } catch (error) {
      await queryRunner.rollbackTransaction();
      console.error('❌ E-KUMPRA seed failed, rolled back:', error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  private async ensureCategory(
    repo: Repository<CategoryEntity>,
    categoryName: string,
    user: UserEntity,
  ): Promise<CategoryEntity> {
    let category = await repo.findOne({
      where: { category_name: categoryName },
    });

    if (!category) {
      const slug = categoryName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      category = await repo.save(
        repo.create({
          category_name: categoryName,
          description: `DPO ${categoryName}`,
          slug: slug,
          display_order: 99,
          status: 'Active',
          seller_id: null,
          created_by: user,
          updated_by: user,
        }),
      );
    }

    return category;
  }

  private async ensureAttribute(
    repo: Repository<AttributeEntity>,
    cache: Map<string, AttributeEntity>,
    name: string,
    sellerId: number,
    user: UserEntity,
  ): Promise<AttributeEntity> {
    const cacheKey = `${sellerId}:${name}`;
    if (cache.has(cacheKey)) {
      return cache.get(cacheKey)!;
    }

    let attribute = await repo.findOne({
      where: { name, seller_id: sellerId },
    });

    if (!attribute) {
      attribute = await repo.save(
        repo.create({
          name,
          seller_id: sellerId,
          status: 'Active',
          created_by: user,
          updated_by: user,
        }),
      );
    }

    cache.set(cacheKey, attribute);
    return attribute;
  }

  private async ensureAttributeValue(
    repo: Repository<AttributeValueEntity>,
    cache: Map<string, AttributeValueEntity>,
    attributeId: number,
    value: string,
    user: UserEntity,
  ): Promise<AttributeValueEntity> {
    const cacheKey = `${attributeId}:${value}`;
    if (cache.has(cacheKey)) {
      return cache.get(cacheKey)!;
    }

    let attributeValue = await repo.findOne({
      where: { attribute_id: attributeId, value },
    });

    if (!attributeValue) {
      attributeValue = await repo.save(
        repo.create({
          attribute_id: attributeId,
          value,
          display_order: 0,
          created_by: user,
          updated_by: user,
        }),
      );
    }

    cache.set(cacheKey, attributeValue);
    return attributeValue;
  }

  private createSlug(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /**
   * Try to find and copy variant image from seed-images folder
   * Source: seed-images/{categoryFolder}/{variantName}.{jpg|jpeg|png|JPG|PNG}
   * Dest: media/sellers/{sellerSlug}/images/originals/{productSlug}-{variantSku}.jpg
   *
   * @param variantName - Variant name to match source image file
   * @param variantSku - Variant SKU for destination filename
   * @param productName - Product name for destination filename
   * @param categoryName - Category name (used as subfolder)
   * @param sellerId - Seller ID
   * @param sellerSlug - Seller store slug
   * @param userId - User ID for created_by
   * @returns MediaEntity or null if image doesn't exist
   */
  async seedVariantImage(
    variantName: string,
    variantSku: string,
    productName: string,
    categoryName: string,
    sellerId: number,
    sellerSlug: string,
    userId: number,
    mediaRepo: Repository<MediaEntity>,
  ): Promise<MediaEntity | null> {
    // Map category names to folder names in seed-images
    const categoryFolderMap: Record<string, string> = {
      'BREAD AND PASTRIES': 'CAKE',
      'PLASTIC PRODUCT': 'PLASTIC PRODUCT',
      'PAPER PRODUCT': 'PLASTIC PRODUCT',
      POWDER: 'POWDERS',
      'FROZEN ITEM': 'FROZEN ITEM',
      GELATO: 'GELATO',
      RTE: 'RTE',
      SAUCE: 'SAUCE',
      SYRUP: 'SYRUP',
    };

    const categoryFolder = categoryFolderMap[categoryName] || categoryName;
    const extensions = ['jpg', 'jpeg', 'png', 'JPG', 'JPEG', 'PNG'];

    // Destination follows the existing pattern: {productSlug}-{variantSku}.jpg
    const productSlug = this.createSlug(productName);
    const destFilename = `${productSlug}-${variantSku}.jpg`;
    const destKey = `media/sellers/${sellerSlug}/images/originals/${destFilename}`;

    // Check if media already exists
    const existingMedia = await mediaRepo.findOne({
      where: { file_path: destKey },
    });

    if (existingMedia) {
      return existingMedia;
    }

    // Try each extension to find source file
    const triedPaths: string[] = [];
    for (const ext of extensions) {
      const sourceFilename = `${variantName}.${ext}`;
      const sourceKey = `${this.SEED_IMAGES_FOLDER}/${categoryFolder}/${sourceFilename}`;
      triedPaths.push(sourceKey);

      try {
        // Get image buffer from source
        const imageBuffer = await this.storageService.getFileBuffer(sourceKey);

        // Upload original to destination
        await this.storageService.putBuffer(imageBuffer, destKey);

        // Process image to generate thumbnails, previews, compressed versions
        const processedResult = await this.imageProcessorService.processImage(
          imageBuffer,
          destKey,
        );

        // Determine mime type based on source
        const mimeType =
          ext.toLowerCase() === 'png' ? 'image/png' : 'image/jpeg';

        // Create media record with actual metadata
        const media = await mediaRepo.save({
          media_type: MediaTypeEnum.IMAGE,
          file_name: destFilename,
          file_path: destKey,
          file_size: processedResult.metadata.size,
          mime_type: mimeType,
          width: processedResult.metadata.width,
          height: processedResult.metadata.height,
          thumbnail_path: processedResult.thumbnail_path,
          preview_path: processedResult.preview_path,
          compressed_path: processedResult.compressed_path,
          processing_status: ProcessingStatusEnum.COMPLETED,
          title: `${variantName} - Variant Image`,
          alt_text: `${variantName} variant image`,
          seller_id: sellerId,
          status: StatusEnum.ACTIVE,
          created_by: userId,
          updated_by: userId,
        });

        console.log(
          `    📷 Seeded: ${sourceFilename} → ${destFilename} (${processedResult.metadata.width}x${processedResult.metadata.height})`,
        );
        return media;
      } catch {
        // This extension didn't work, try next one
        continue;
      }
    }

    // No image found with any extension
    console.log(
      `    ⚠️ No image found for "${variantName}". Tried: ${triedPaths[0]}`,
    );
    return null;
  }

  /**
   * Create product-media mapping
   */
  async createProductMediaMapping(
    productId: number,
    mediaId: number,
    userId: number,
    isPrimary: boolean = true,
    mediaMappingRepo: Repository<ProductMediaMappingEntity>,
  ): Promise<void> {
    const existingMapping = await mediaMappingRepo.findOne({
      where: { product_id: productId, media_id: mediaId },
    });

    if (!existingMapping) {
      await mediaMappingRepo.save({
        product_id: productId,
        media_id: mediaId,
        is_primary: isPrimary,
        display_order: 0,
        created_by: userId,
        updated_by: userId,
      });
    }
  }
}
