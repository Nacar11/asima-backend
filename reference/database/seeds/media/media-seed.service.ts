import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ISeedService } from '../seed.interface';
import { IsNull, Repository } from 'typeorm';
import { MediaEntity } from '@/media/persistence/entities/media.entity';
import { ProductMediaMappingEntity } from '@/media/persistence/entities/product-media-mapping.entity';
import { ProductEntity } from '@/products/persistence/entities/product.entity';
import { ProductVariantEntity } from '@/product-variants/persistence/entities/product-variant.entity';
import { SellerEntity } from '@/sellers/persistence/entities/seller.entity';
import { UserEntity } from '@/users/persistence/entities/user.entity';
import { CategoryEntity } from '@/categories/persistence/entities/category.entity';
import { MediaTypeEnum } from '@/media/domain/media-type.enum';
import { ProcessingStatusEnum } from '@/media/domain/processing-status.enum';
import { StatusEnum } from '@/utils/enums/status-enum';

@Injectable()
export class MediaSeedService implements ISeedService {
  constructor(
    @InjectRepository(MediaEntity)
    private mediaRepository: Repository<MediaEntity>,
    @InjectRepository(ProductMediaMappingEntity)
    private mediaMappingRepository: Repository<ProductMediaMappingEntity>,
    @InjectRepository(ProductEntity)
    private productRepository: Repository<ProductEntity>,
    @InjectRepository(ProductVariantEntity)
    private variantRepository: Repository<ProductVariantEntity>,
    @InjectRepository(SellerEntity)
    private sellerRepository: Repository<SellerEntity>,
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    @InjectRepository(CategoryEntity)
    private categoryRepository: Repository<CategoryEntity>,
  ) {}

  private createSlug(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  async run(): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: 1 } });
    if (!user) {
      console.error(
        '❌ Required user not found. Cannot proceed to seed media.',
      );
      return;
    }
    const seller2User = await this.userRepository.findOne({ where: { id: 2 } });
    const seller2 = await this.sellerRepository.findOne({ where: { id: 2 } });
    const seller3User = await this.userRepository.findOne({ where: { id: 3 } });
    const seller3 = await this.sellerRepository.findOne({ where: { id: 3 } });
    const products = await this.productRepository.find();
    const sellers = await this.sellerRepository.find();
    const sellerSlugById = new Map<number, string>();
    for (const seller of sellers) {
      sellerSlugById.set(seller.id, this.createSlug(seller.store_name));
    }
    const getActorUserId = (sellerId: number): number => {
      if (seller2User && seller2 && sellerId === seller2.id) {
        return seller2User.id;
      }
      if (seller3User && seller3 && sellerId === seller3.id) {
        return seller3User.id;
      }
      return user.id;
    };
    // Uncle Brew product image search terms for better Openverse results
    const uncleBrewImageSearchTerms: Record<string, string> = {
      'premium-arabica-coffee-beans': 'arabica coffee beans roasted bag',
      'premium-robusta-coffee-beans': 'robusta coffee beans roasted bag',
      'single-origin-arabica-coffee-beans-ethiopia':
        'ethiopian coffee beans bag',
      'single-origin-arabica-coffee-beans-colombia':
        'colombian coffee beans bag',
      'espresso-blend-coffee-beans': 'espresso blend coffee beans bag',
      'cup-sealer-machine': 'cup sealer machine bubble tea',
      'milk-tea-shaker-machine': 'milk tea shaker machine',
      'fructose-dispenser': 'fructose dispenser bubble tea',
      'automatic-tea-brewer': 'automatic tea brewer machine',
      'commercial-blender': 'commercial blender',
      'pp-cups-16oz-50pcs': 'plastic cups bubble tea',
      'pp-cups-22oz-50pcs': 'plastic cups bubble tea large',
      'sealer-film-roll': 'cup sealer film roll',
      'fat-straws-100pcs': 'boba straw fat straw bubble tea',
      'milk-tea-powder-1kg': 'milk tea powder instant',
      'fructose-syrup-25kg': 'fructose syrup sweetener',
      'tapioca-pearls-1kg': 'tapioca pearls black boba',
      'coffee-jelly-1kg': 'coffee jelly topping bubble tea',
      'non-dairy-creamer-1kg': 'non dairy creamer powder',
    };
    const buildSellerScopedObjectKey = (input: {
      readonly sellerSlug: string;
      readonly fileName: string;
    }): string => {
      return `media/sellers/${input.sellerSlug}/images/originals/${input.fileName}`;
    };
    const buildAdminScopedObjectKey = (input: {
      readonly adminId: number;
      readonly fileName: string;
    }): string => {
      return `media/admins/${input.adminId}/images/originals/${input.fileName}`;
    };
    let createdMediaCount = 0;
    let createdMappingsCount = 0;
    let createdVariantMediaCount = 0;
    let skippedCount = 0;
    if (products.length === 0) {
      console.warn('⚠️ No products found. Skipping product media seeding.');
    }
    for (const product of products) {
      const sellerSlug = sellerSlugById.get(product.seller_id);
      if (!sellerSlug) {
        continue;
      }
      const productSlug = this.createSlug(product.product_name);
      const productFileName = `${productSlug}.jpg`;
      const filePath = buildSellerScopedObjectKey({
        sellerSlug,
        fileName: productFileName,
      });
      const actorUserId = getActorUserId(product.seller_id);
      // Use custom search term for Uncle Brew products for better image results
      const customSearchTerm = uncleBrewImageSearchTerms[productSlug];
      const mediaTitle = customSearchTerm
        ? `${customSearchTerm} - Primary Image`
        : `${product.product_name} - Primary Image`;
      const existingMedia = await this.mediaRepository.findOne({
        where: {
          file_path: filePath,
        },
      });
      const media =
        existingMedia ??
        (await this.mediaRepository.save({
          media_type: MediaTypeEnum.IMAGE,
          file_name: productFileName,
          file_path: filePath,
          file_size: 0,
          mime_type: 'image/jpeg',
          width: 1200,
          height: 1200,
          processing_status: ProcessingStatusEnum.COMPLETED,
          title: mediaTitle,
          alt_text: `${product.product_name} primary image`,
          seller_id: product.seller_id,
          status: StatusEnum.ACTIVE,
          created_by: actorUserId,
          updated_by: actorUserId,
        }));
      if (!existingMedia) {
        createdMediaCount++;
      }
      const existingPrimaryMapping = await this.mediaMappingRepository.findOne({
        where: {
          product_id: product.id,
          is_primary: true,
        },
      });
      if (existingPrimaryMapping) {
        if (existingPrimaryMapping.media_id === media.id) {
          skippedCount++;
          continue;
        }
        await this.mediaMappingRepository.update(existingPrimaryMapping.id, {
          media_id: media.id,
          display_order: 0,
        });
        createdMappingsCount++;
      } else {
        const existingMapping = await this.mediaMappingRepository.findOne({
          where: {
            product_id: product.id,
            media_id: media.id,
          },
        });
        if (existingMapping) {
          await this.mediaMappingRepository.update(existingMapping.id, {
            is_primary: true,
            display_order: 0,
          });
          createdMappingsCount++;
        } else {
          await this.mediaMappingRepository.save({
            product_id: product.id,
            media_id: media.id,
            display_order: 0,
            is_primary: true,
            created_by: actorUserId,
          });
          createdMappingsCount++;
        }
      }
      const variants = await this.variantRepository.find({
        where: {
          product_id: product.id,
        },
      });
      for (const variant of variants) {
        const variantFileName = `${productSlug}-${variant.sku}.jpg`;
        const variantFilePath = buildSellerScopedObjectKey({
          sellerSlug,
          fileName: variantFileName,
        });
        // Use custom search term for Uncle Brew variant images
        const variantMediaTitle = customSearchTerm
          ? `${customSearchTerm} - Variant Image`
          : `${variant.variant_name} - Variant Image`;
        const existingVariantMedia = await this.mediaRepository.findOne({
          where: {
            file_path: variantFilePath,
          },
        });
        const variantMedia =
          existingVariantMedia ??
          (await this.mediaRepository.save({
            media_type: MediaTypeEnum.IMAGE,
            file_name: variantFileName,
            file_path: variantFilePath,
            file_size: 0,
            mime_type: 'image/jpeg',
            width: 1200,
            height: 1200,
            processing_status: ProcessingStatusEnum.COMPLETED,
            title: variantMediaTitle,
            alt_text: `${variant.variant_name} variant image`,
            seller_id: product.seller_id,
            status: StatusEnum.ACTIVE,
            created_by: actorUserId,
            updated_by: actorUserId,
          }));
        if (!existingVariantMedia) {
          createdVariantMediaCount++;
        }
        if (variant.media_id === variantMedia.id) {
          continue;
        }
        await this.variantRepository.update(variant.id, {
          media_id: variantMedia.id,
        });
      }
    }
    const globalCategories = await this.categoryRepository.find({
      where: {
        seller_id: IsNull(),
      },
      order: {
        display_order: 'ASC',
        created_at: 'ASC',
      },
    });
    let createdCategoryBannerMediaCount = 0;
    let updatedCategoryBannerCount = 0;
    const adminId = 1;
    for (const category of globalCategories) {
      const categorySlug =
        category.slug || this.createSlug(category.category_name);
      const bannerFileName = `category-banner-${categorySlug}.jpg`;
      const bannerFilePath = buildAdminScopedObjectKey({
        adminId,
        fileName: bannerFileName,
      });
      const existingBannerMedia = await this.mediaRepository.findOne({
        where: {
          file_path: bannerFilePath,
        },
      });
      const bannerMedia =
        existingBannerMedia ??
        (await this.mediaRepository.save({
          media_type: MediaTypeEnum.IMAGE,
          file_name: bannerFileName,
          file_path: bannerFilePath,
          file_size: 0,
          mime_type: 'image/jpeg',
          width: 1000,
          height: 200,
          processing_status: ProcessingStatusEnum.COMPLETED,
          title: `${category.category_name} - Category Banner`,
          alt_text: `${category.category_name} category banner`,
          status: StatusEnum.ACTIVE,
          created_by: user.id,
          updated_by: user.id,
        }));
      if (!existingBannerMedia) {
        createdCategoryBannerMediaCount++;
      }
      if (category.media_id === bannerMedia.id) {
        continue;
      }
      category.media_id = bannerMedia.id;
      category.updated_by = user;
      await this.categoryRepository.save(category);
      updatedCategoryBannerCount++;
    }
    console.log('✅ Media seed completed');
    console.log(`   - ${createdMediaCount} media records inserted`);
    console.log(
      `   - ${createdVariantMediaCount} variant media records inserted`,
    );
    console.log(`   - ${createdMappingsCount} product media mappings inserted`);
    console.log(
      `   - ${createdCategoryBannerMediaCount} category banner media records inserted`,
    );
    console.log(
      `   - ${updatedCategoryBannerCount} categories linked to banners`,
    );
    console.log(`   - ${skippedCount} mappings already existed`);
  }
}
