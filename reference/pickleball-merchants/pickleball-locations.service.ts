import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { EdistrictService } from '@/discovery/edistrict.service';
import { PickleballLocationEntity } from '@/pickleball-merchants/persistence/entities/pickleball-location.entity';
import { PickleballMerchantApplicationEntity } from '@/pickleball-merchants/persistence/entities/pickleball-merchant-application.entity';
import { PickleballLocationResponseDto } from '@/pickleball-merchants/dto/pickleball-location-response.dto';
import { PickleballMerchantOwnerSetupStatusEnum } from '@/pickleball-merchants/enums/pickleball-merchant-owner-setup-status.enum';
import { PickleballMerchantSubscriptionPaymentStatusEnum } from '@/pickleball-merchants/enums/pickleball-merchant-subscription-payment-status.enum';
import { PickleballMerchantOnboardingStatusEnum } from '@/pickleball-merchants/enums/pickleball-merchant-onboarding-status.enum';
import { PickleballMerchantListingStatusEnum } from '@/pickleball-merchants/enums/pickleball-merchant-listing-status.enum';
import { PickleballMerchantApplicationStatusEnum } from '@/pickleball-merchants/enums/pickleball-merchant-application-status.enum';
import { SellerEntity } from '@/sellers/persistence/entities/seller.entity';
import { SubscriptionEntity } from '@/subscriptions/persistence/entities/subscription.entity';
import { SubscriptionStatusEnum } from '@/subscriptions/enums/subscription-status.enum';
import { ServiceEntity } from '@/services/persistence/entities/service.entity';
import { ServiceTypeEnum } from '@/services/enums/service-type.enum';
import { ServiceStatusEnum } from '@/services/enums/service-status.enum';

@Injectable()
export class PickleballLocationsService {
  constructor(
    @InjectRepository(PickleballLocationEntity)
    private readonly pickleballLocationRepository: Repository<PickleballLocationEntity>,
    private readonly edistrictService: EdistrictService,
  ) {}

  async findPublicLocations(
    userId: number | null,
  ): Promise<PickleballLocationResponseDto[]> {
    const [officialLocationsResult, independentLocations] = await Promise.all([
      this.edistrictService.findVisibleEdistricts(userId),
      this.findVisibleIndependentLocations(),
    ]);
    const officialLocations = officialLocationsResult.data;

    const officialDtos: PickleballLocationResponseDto[] = officialLocations.map(
      (edistrict) => ({
        key: edistrict.key,
        name: edistrict.name,
        subtitle: edistrict.subtitle,
        store_name: edistrict.store_name,
        seller_id: edistrict.seller_id,
        image_url: edistrict.image_url,
        background_image_url: edistrict.background_image_url,
        status: edistrict.status,
        display_order: edistrict.display_order,
        is_locked: edistrict.is_locked ?? false,
        is_official: true,
        source_type: 'official_branch',
        city: null,
        province: null,
      }),
    );

    return [...officialDtos, ...independentLocations].sort((left, right) => {
      if (left.is_official !== right.is_official) {
        return left.is_official ? -1 : 1;
      }

      return (
        left.display_order - right.display_order ||
        left.name.localeCompare(right.name)
      );
    });
  }

  async findVisibleIndependentLocations(): Promise<
    PickleballLocationResponseDto[]
  > {
    const rows = await this.pickleballLocationRepository
      .createQueryBuilder('location')
      .innerJoin(SellerEntity, 'seller', 'seller.id = location.seller_id')
      .innerJoin(
        PickleballMerchantApplicationEntity,
        'application',
        'application.id = location.application_id AND application.deleted_at IS NULL',
      )
      .innerJoin(
        SubscriptionEntity,
        'subscription',
        'subscription.user_id = seller.user_id AND subscription.status = :subscriptionStatus AND subscription.deleted_at IS NULL',
        { subscriptionStatus: SubscriptionStatusEnum.ACTIVE },
      )
      .innerJoin(
        ServiceEntity,
        'service',
        'service.seller_id = seller.id AND service.deleted_at IS NULL AND service.service_type = :serviceType AND service.status = :serviceStatus',
        {
          serviceType: ServiceTypeEnum.VENUE,
          serviceStatus: ServiceStatusEnum.ACTIVE,
        },
      )
      .where('location.deleted_at IS NULL')
      .andWhere('location.status = :status', { status: 'active' })
      .andWhere('application.status = :applicationStatus', {
        applicationStatus: PickleballMerchantApplicationStatusEnum.COMPLETED,
      })
      .andWhere('application.owner_setup_status = :ownerSetupStatus', {
        ownerSetupStatus: PickleballMerchantOwnerSetupStatusEnum.COMPLETED,
      })
      .andWhere(
        'application.subscription_payment_status = :subscriptionPaymentStatus',
        {
          subscriptionPaymentStatus:
            PickleballMerchantSubscriptionPaymentStatusEnum.APPROVED,
        },
      )
      .andWhere('application.onboarding_status = :onboardingStatus', {
        onboardingStatus: PickleballMerchantOnboardingStatusEnum.COMPLETED,
      })
      .andWhere('application.listing_status = :listingStatus', {
        listingStatus: PickleballMerchantListingStatusEnum.PUBLIC,
      })
      .select([
        'location.id AS id',
        'location.key AS key',
        'location.name AS name',
        'location.subtitle AS subtitle',
        'location.store_name AS store_name',
        'location.seller_id AS seller_id',
        'location.image_url AS image_url',
        'location.background_image_url AS background_image_url',
        'location.status AS status',
        'location.display_order AS display_order',
        'location.city AS city',
        'location.province AS province',
      ])
      .groupBy('location.id')
      .addGroupBy('location.key')
      .addGroupBy('location.name')
      .addGroupBy('location.subtitle')
      .addGroupBy('location.store_name')
      .addGroupBy('location.seller_id')
      .addGroupBy('location.image_url')
      .addGroupBy('location.background_image_url')
      .addGroupBy('location.status')
      .addGroupBy('location.display_order')
      .addGroupBy('location.city')
      .addGroupBy('location.province')
      .orderBy('location.display_order', 'ASC')
      .addOrderBy('location.name', 'ASC')
      .getRawMany<{
        id: string;
        key: string;
        name: string;
        subtitle: string | null;
        store_name: string | null;
        seller_id: string;
        image_url: string | null;
        background_image_url: string | null;
        status: string;
        display_order: string;
        city: string | null;
        province: string | null;
      }>();

    return rows.map((row) => ({
      key: row.key,
      name: row.name,
      subtitle: row.subtitle,
      store_name: row.store_name,
      seller_id: Number(row.seller_id),
      image_url: row.image_url,
      background_image_url: row.background_image_url,
      status: row.status,
      display_order: Number(row.display_order),
      is_locked: false,
      is_official: false,
      source_type: 'independent_merchant',
      city: row.city,
      province: row.province,
    }));
  }

  async resolveSellerIdForVisibleLocationKey(
    key: string,
  ): Promise<number | null> {
    const normalizedKey = String(key || '')
      .trim()
      .toLowerCase();

    if (!normalizedKey) {
      return null;
    }

    const row = await this.pickleballLocationRepository
      .createQueryBuilder('location')
      .innerJoin(SellerEntity, 'seller', 'seller.id = location.seller_id')
      .innerJoin(
        PickleballMerchantApplicationEntity,
        'application',
        'application.id = location.application_id AND application.deleted_at IS NULL',
      )
      .innerJoin(
        SubscriptionEntity,
        'subscription',
        'subscription.user_id = seller.user_id AND subscription.status = :subscriptionStatus AND subscription.deleted_at IS NULL',
        { subscriptionStatus: SubscriptionStatusEnum.ACTIVE },
      )
      .innerJoin(
        ServiceEntity,
        'service',
        'service.seller_id = seller.id AND service.deleted_at IS NULL AND service.service_type = :serviceType AND service.status = :serviceStatus',
        {
          serviceType: ServiceTypeEnum.VENUE,
          serviceStatus: ServiceStatusEnum.ACTIVE,
        },
      )
      .where('location.deleted_at IS NULL')
      .andWhere('location.status = :status', { status: 'active' })
      .andWhere('application.status = :applicationStatus', {
        applicationStatus: PickleballMerchantApplicationStatusEnum.COMPLETED,
      })
      .andWhere('application.owner_setup_status = :ownerSetupStatus', {
        ownerSetupStatus: PickleballMerchantOwnerSetupStatusEnum.COMPLETED,
      })
      .andWhere(
        'application.subscription_payment_status = :subscriptionPaymentStatus',
        {
          subscriptionPaymentStatus:
            PickleballMerchantSubscriptionPaymentStatusEnum.APPROVED,
        },
      )
      .andWhere('application.onboarding_status = :onboardingStatus', {
        onboardingStatus: PickleballMerchantOnboardingStatusEnum.COMPLETED,
      })
      .andWhere('application.listing_status = :listingStatus', {
        listingStatus: PickleballMerchantListingStatusEnum.PUBLIC,
      })
      .andWhere('location.key = :key', { key: normalizedKey })
      .select('location.seller_id', 'seller_id')
      .groupBy('location.seller_id')
      .getRawOne<{ seller_id: string }>();

    return row?.seller_id ? Number(row.seller_id) : null;
  }

  async findAnyIndependentLocationByKey(
    key: string,
  ): Promise<PickleballLocationEntity | null> {
    const normalizedKey = String(key || '')
      .trim()
      .toLowerCase();

    if (!normalizedKey) {
      return null;
    }

    return this.pickleballLocationRepository.findOne({
      where: { key: normalizedKey, deleted_at: IsNull() },
    });
  }
}
