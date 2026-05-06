import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as fs from 'fs/promises';
import { join } from 'path';
import { CustomPaymentMethodEntity } from '@/checkout-payments/persistence/entities/custom-payment-method.entity';
import { StorageService } from '@/storage/storage.service';
import { ISeedService } from '@/database/seeds/seed.interface';

type BuiltinQrMethod = {
  readonly code: string;
  readonly name: string;
  readonly description: string;
  readonly iconFile: string;
  readonly iconContentType: string;
  readonly qrFile: string;
  readonly qrContentType: string;
  readonly sortOrder: number;
};

const BUILTIN_QR_METHODS: BuiltinQrMethod[] = [
  {
    code: 'gcash',
    name: 'GCash QR',
    description: 'Scan the GCash QR code and upload your proof of payment.',
    iconFile: 'pm_logo_gcash.png',
    iconContentType: 'image/png',
    qrFile: 'pm_qr_gcash.jpeg',
    qrContentType: 'image/jpeg',
    sortOrder: 3,
  },
  {
    code: 'maya_qr',
    name: 'Maya QR',
    description: 'Scan the Maya QR code and upload your proof of payment.',
    iconFile: 'pm_logo_maya.png',
    iconContentType: 'image/png',
    qrFile: 'pm_qr_maya.jpeg',
    qrContentType: 'image/jpeg',
    sortOrder: 4,
  },
  {
    code: 'unionbank_qr',
    name: 'UnionBank QR',
    description: 'Scan the UnionBank QR code and upload your proof of payment.',
    iconFile: 'pm_logo_unionbank.svg',
    iconContentType: 'image/svg+xml',
    qrFile: 'pm_qr_unionbank.jpeg',
    qrContentType: 'image/jpeg',
    sortOrder: 5,
  },
];

@Injectable()
export class PaymentGatewaySettingsSeedService implements ISeedService {
  constructor(
    @InjectRepository(CustomPaymentMethodEntity)
    private readonly customPaymentMethodRepository: Repository<CustomPaymentMethodEntity>,
    private readonly storageService: StorageService,
  ) {}

  async run(): Promise<void> {
    const uploadedKeys = await this.uploadImages();

    const results = await Promise.all(
      BUILTIN_QR_METHODS.map((method) =>
        this.upsertMethod(method, uploadedKeys),
      ),
    );

    const insertedCount = results.filter((r) => r === 'inserted').length;
    const updatedCount = results.filter((r) => r === 'updated').length;

    console.log(
      `✅ Payment gateway settings seed completed (${insertedCount} inserted, ${updatedCount} updated)`,
    );
  }

  private async upsertMethod(
    method: BuiltinQrMethod,
    uploadedKeys: Record<string, string>,
  ): Promise<'inserted' | 'updated' | 'skipped'> {
    const iconUrl = uploadedKeys[`${method.code}_icon`] ?? null;
    const qrImageUrl = uploadedKeys[`${method.code}_qr`] ?? null;

    const existing = await this.customPaymentMethodRepository.findOne({
      where: { code: method.code },
      withDeleted: true,
    });

    if (existing) {
      const needsUpdate =
        existing.name !== method.name ||
        existing.description !== method.description ||
        existing.sort_order !== method.sortOrder ||
        !existing.is_builtin ||
        !existing.is_enabled ||
        existing.deleted_at !== null ||
        (iconUrl && existing.icon_url !== iconUrl) ||
        (qrImageUrl && existing.qr_image_url !== qrImageUrl);

      if (!needsUpdate) return 'skipped';

      await this.customPaymentMethodRepository.save({
        ...existing,
        name: method.name,
        description: method.description,
        icon_url: iconUrl ?? existing.icon_url,
        qr_image_url: qrImageUrl ?? existing.qr_image_url,
        sort_order: method.sortOrder,
        is_builtin: true,
        is_enabled: true,
        deleted_at: null,
      });

      return 'updated';
    }

    await this.customPaymentMethodRepository.save(
      this.customPaymentMethodRepository.create({
        code: method.code,
        name: method.name,
        icon_url: iconUrl,
        qr_image_url: qrImageUrl,
        sort_order: method.sortOrder,
        is_builtin: true,
        is_enabled: true,
        description: method.description,
      }),
    );

    return 'inserted';
  }

  private async uploadImages(): Promise<Record<string, string>> {
    const uploads = BUILTIN_QR_METHODS.flatMap((method) => [
      {
        key: `${method.code}_icon`,
        objectKey: `media/payment-methods/icons/${method.iconFile}`,
        fileName: method.iconFile,
        contentType: method.iconContentType,
      },
      {
        key: `${method.code}_qr`,
        objectKey: `media/payment-methods/qr/${method.qrFile}`,
        fileName: method.qrFile,
        contentType: method.qrContentType,
      },
    ]);

    const results = await Promise.all(
      uploads.map(async ({ key, objectKey, fileName, contentType }) => {
        const url = await this.uploadFile(fileName, objectKey, contentType);
        return { key, url };
      }),
    );

    return Object.fromEntries(
      results
        .filter(({ url }) => url !== null)
        .map(({ key, url }) => [key, url as string]),
    );
  }

  private async uploadFile(
    fileName: string,
    objectKey: string,
    contentType: string,
  ): Promise<string | null> {
    const sourcePath = join(process.cwd(), 'public', 'images', fileName);
    try {
      const buffer = await fs.readFile(sourcePath);
      const result = await this.storageService.putBuffer(
        buffer,
        objectKey,
        contentType,
      );
      console.log(`✅ Uploaded payment method asset: ${objectKey}`);
      return result.url ?? objectKey;
    } catch (error) {
      const err = error as NodeJS.ErrnoException;
      if (err.code === 'ENOENT') {
        console.warn(`⚠️  Missing seed image file: ${sourcePath}`);
        return null;
      }
      console.warn(
        `⚠️  Failed to upload seed image (${objectKey}): ${err.message}`,
      );
      return null;
    }
  }
}
