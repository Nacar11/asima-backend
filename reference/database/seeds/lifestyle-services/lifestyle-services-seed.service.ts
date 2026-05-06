import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { ISeedService } from '@/database/seeds/seed.interface';
import { VoucherEntity } from '@/vouchers/persistence/entities/voucher.entity';
import { VoucherScopeEnum } from '@/vouchers/enums/voucher-scope.enum';
import { VoucherServiceEntity } from '@/voucher-services/persistence/entities/voucher-service.entity';
import { ServiceEntity } from '@/services/persistence/entities/service.entity';

const LIFESTYLE_VOUCHER_CODES: readonly string[] = [
  'FREE-LIFESTYLE-PERK-CORE-1X',
  'FREE-LIFESTYLE-PERK-ELITE-1X',
] as const;

const LIFESTYLE_SERVICE_TITLE_KEYS: ReadonlySet<string> = new Set([
  'standard carwash',
  '60 minute massage',
  '60 min massage',
  'barber service',
  'mani pedi service',
]);

type VoucherServiceSyncResult = {
  readonly insertedCount: number;
  readonly deletedCount: number;
};

@Injectable()
export class LifestyleServicesSeedService implements ISeedService {
  constructor(
    @InjectRepository(VoucherEntity)
    private readonly voucherRepository: Repository<VoucherEntity>,
    @InjectRepository(VoucherServiceEntity)
    private readonly voucherServiceRepository: Repository<VoucherServiceEntity>,
    @InjectRepository(ServiceEntity)
    private readonly serviceRepository: Repository<ServiceEntity>,
  ) {}

  async run(): Promise<void> {
    const vouchers: VoucherEntity[] = await this.voucherRepository
      .createQueryBuilder('voucher')
      .select(['voucher.id', 'voucher.code', 'voucher.scope'])
      .where('UPPER(voucher.code) IN (:...codes)', {
        codes: LIFESTYLE_VOUCHER_CODES.map((code: string) =>
          code.toUpperCase(),
        ),
      })
      .andWhere('voucher.deleted_at IS NULL')
      .getMany();

    if (vouchers.length === 0) {
      console.log(
        '⚠️ Lifestyle voucher-services seed skipped (no lifestyle voucher found).',
      );
      return;
    }

    const lifestyleVouchers: VoucherEntity[] = vouchers.filter(
      (voucher: VoucherEntity): boolean =>
        voucher.scope === VoucherScopeEnum.SERVICES,
    );

    if (lifestyleVouchers.length === 0) {
      console.log(
        '⚠️ Lifestyle voucher-services seed skipped (voucher scope is not services).',
      );
      return;
    }

    const services: ServiceEntity[] = await this.serviceRepository
      .createQueryBuilder('service')
      .select(['service.id', 'service.title'])
      .where('service.deleted_at IS NULL')
      .getMany();

    const eligibleServices: ServiceEntity[] = services.filter(
      (service: ServiceEntity): boolean =>
        this.isLifestylePerkServiceTitle(service.title),
    );

    const eligibleServiceIds: number[] = eligibleServices.map(
      (service: ServiceEntity): number => service.id,
    );

    let insertedCount = 0;
    let deletedCount = 0;

    for (const voucher of lifestyleVouchers) {
      const syncResult: VoucherServiceSyncResult =
        await this.syncVoucherServiceLinks({
          voucherId: voucher.id,
          nextServiceIds: eligibleServiceIds,
        });
      insertedCount += syncResult.insertedCount;
      deletedCount += syncResult.deletedCount;
    }

    console.log(
      `✅ Lifestyle voucher-services seed completed (${lifestyleVouchers.length} voucher(s), ${eligibleServiceIds.length} eligible service(s), ${insertedCount} link(s) inserted, ${deletedCount} link(s) deleted)`,
    );
  }

  private normalizeTitle(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .trim()
      .replace(/\s+/g, ' ');
  }

  private isLifestylePerkServiceTitle(title: string): boolean {
    return LIFESTYLE_SERVICE_TITLE_KEYS.has(this.normalizeTitle(title));
  }

  private async syncVoucherServiceLinks(input: {
    voucherId: number;
    nextServiceIds: number[];
  }): Promise<VoucherServiceSyncResult> {
    const existingLinks: VoucherServiceEntity[] =
      await this.voucherServiceRepository.find({
        where: { voucher_id: input.voucherId },
      });

    const existingServiceIdSet: Set<number> = new Set(
      existingLinks.map((link: VoucherServiceEntity) => link.service_id),
    );
    const nextServiceIdSet: Set<number> = new Set(input.nextServiceIds);

    const linkIdsToDelete: number[] = existingLinks
      .filter(
        (link: VoucherServiceEntity): boolean =>
          !nextServiceIdSet.has(link.service_id),
      )
      .map((link: VoucherServiceEntity): number => link.id);

    if (linkIdsToDelete.length > 0) {
      await this.voucherServiceRepository.delete({ id: In(linkIdsToDelete) });
    }

    const serviceIdsToCreate: number[] = input.nextServiceIds.filter(
      (serviceId: number): boolean => !existingServiceIdSet.has(serviceId),
    );

    if (serviceIdsToCreate.length > 0) {
      await this.voucherServiceRepository.save(
        serviceIdsToCreate.map((serviceId: number) =>
          this.voucherServiceRepository.create({
            voucher_id: input.voucherId,
            service_id: serviceId,
          }),
        ),
      );
    }

    return {
      insertedCount: serviceIdsToCreate.length,
      deletedCount: linkIdsToDelete.length,
    };
  }
}
