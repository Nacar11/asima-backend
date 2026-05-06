import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import * as fs from 'fs/promises';
import { join } from 'path';
import { ISeedService } from '@/database/seeds/seed.interface';
import { StorageService } from '@/storage/storage.service';
import { SellerEntity } from '@/sellers/persistence/entities/seller.entity';
import { EdistrictEntity } from '@/discovery/persistence/entities/edistrict.entity';

const EDISTRICT_IMAGE_BASE = 'media/discovery/edistricts/images/originals';

type EdistrictSeedDefinition = {
  key: string;
  name: string;
  subtitle: string | null;
  storeName: string | null;
  sellerStoreNames: string[];
  status: string;
  displayOrder: number;
  imageFileName: string | null;
  imageContentType: string | null;
  backgroundImageFileName: string | null;
  backgroundImageContentType: string | null;
};

const EDISTRICT_DEFINITIONS: EdistrictSeedDefinition[] = [
  {
    key: 'anjo-world',
    name: 'Anjo World',
    subtitle: 'Browse services on',
    storeName: 'Ulrak Pickle Ball Hub',
    sellerStoreNames: ['Ulrak Pickle Ball Hub'],
    status: 'active',
    displayOrder: 1,
    imageFileName: 'edistrict-icon-anjo-world.jpeg',
    imageContentType: 'image/jpeg',
    backgroundImageFileName: 'edistrict-bg-anjo-world.webp',
    backgroundImageContentType: 'image/webp',
  },
  {
    key: 'tambayan-district',
    name: 'Tambayan District',
    subtitle: 'Browse services on',
    storeName: 'Ulrak Tambayan',
    sellerStoreNames: ['Ulrak Tambayan', 'Tambayan District'],
    status: 'active',
    displayOrder: 2,
    imageFileName: 'edistrict-icon-tambayan-district.jpg',
    imageContentType: 'image/jpeg',
    backgroundImageFileName: 'edistrict-bg-tambayan-district.webp',
    backgroundImageContentType: 'image/webp',
  },
  {
    key: 'minglanilla-tungkop',
    name: 'Minglanilla Tungkop',
    subtitle: null,
    storeName: null,
    sellerStoreNames: [],
    status: 'coming_soon',
    displayOrder: 3,
    imageFileName: null,
    imageContentType: null,
    backgroundImageFileName: null,
    backgroundImageContentType: null,
  },
];

@Injectable()
export class EdistrictSeedService implements ISeedService {
  constructor(
    @InjectRepository(EdistrictEntity)
    private readonly edistrictRepository: Repository<EdistrictEntity>,
    @InjectRepository(SellerEntity)
    private readonly sellerRepository: Repository<SellerEntity>,
    private readonly storageService: StorageService,
  ) {}

  async run(): Promise<void> {
    for (const definition of EDISTRICT_DEFINITIONS) {
      const imageUrl = definition.imageFileName
        ? await this.uploadEdistrictImage(
            definition.imageFileName,
            definition.imageContentType!,
          )
        : null;
      const backgroundImageUrl = definition.backgroundImageFileName
        ? await this.uploadEdistrictImage(
            definition.backgroundImageFileName,
            definition.backgroundImageContentType!,
          )
        : null;
      const seller = await this.findSellerByStoreNames(
        definition.sellerStoreNames,
      );
      const existing = await this.edistrictRepository.findOne({
        where: { key: definition.key, deleted_at: IsNull() },
      });

      const payload: Partial<EdistrictEntity> = {
        key: definition.key,
        name: definition.name,
        subtitle: definition.subtitle,
        store_name: definition.storeName,
        seller_id: seller?.id ?? null,
        image_url: imageUrl ?? existing?.image_url ?? null,
        background_image_url:
          backgroundImageUrl ?? existing?.background_image_url ?? null,
        display_order: definition.displayOrder,
        // status is only set on initial creation — preserve admin-managed changes on update
        ...(!existing && { status: definition.status }),
      };

      if (existing) {
        await this.edistrictRepository.update(existing.id, payload);
        console.log(`✅ Edistrict updated: ${definition.key}`);
      } else {
        await this.edistrictRepository.save(
          this.edistrictRepository.create(payload),
        );
        console.log(`✅ Edistrict created: ${definition.key}`);
      }
    }
  }

  async down(): Promise<void> {
    await this.edistrictRepository
      .createQueryBuilder()
      .delete()
      .where('key IN (:...keys)', {
        keys: EDISTRICT_DEFINITIONS.map((item) => item.key),
      })
      .execute();

    console.log('✅ Edistrict seed rollback completed');
  }

  private async uploadEdistrictImage(
    fileName: string,
    contentType: string,
  ): Promise<string | null> {
    const sourcePath = join(process.cwd(), 'public', 'images', fileName);
    const objectKey = `${EDISTRICT_IMAGE_BASE}/${fileName}`;

    try {
      const buffer = await fs.readFile(sourcePath);
      const uploaded = await this.storageService.putBuffer(
        buffer,
        objectKey,
        contentType,
      );
      console.log(`✅ Uploaded edistrict image: ${objectKey}`);
      return uploaded.url?.toString() ?? null;
    } catch (error) {
      const err = error as NodeJS.ErrnoException;
      if (err.code === 'ENOENT') {
        console.warn(`⚠️  Missing edistrict seed image file: ${sourcePath}`);
        return null;
      }
      console.warn(
        `⚠️  Failed to upload edistrict image (${objectKey}): ${err.message}`,
      );
      return null;
    }
  }

  private async findSellerByStoreNames(
    storeNames: string[],
  ): Promise<SellerEntity | null> {
    for (const storeName of storeNames) {
      const seller = await this.sellerRepository
        .createQueryBuilder('seller')
        .where('LOWER(seller.store_name) = LOWER(:storeName)', { storeName })
        .andWhere('seller.deleted_at IS NULL')
        .getOne();

      if (seller) {
        return seller;
      }
    }

    return null;
  }
}
