import { PickleballLocationsService } from '@/pickleball-merchants/pickleball-locations.service';
import { SubscriptionStatusEnum } from '@/subscriptions/enums/subscription-status.enum';
import { ServiceTypeEnum } from '@/services/enums/service-type.enum';
import { ServiceStatusEnum } from '@/services/enums/service-status.enum';
import { PickleballMerchantApplicationStatusEnum } from '@/pickleball-merchants/enums/pickleball-merchant-application-status.enum';
import { PickleballMerchantOwnerSetupStatusEnum } from '@/pickleball-merchants/enums/pickleball-merchant-owner-setup-status.enum';
import { PickleballMerchantSubscriptionPaymentStatusEnum } from '@/pickleball-merchants/enums/pickleball-merchant-subscription-payment-status.enum';
import { PickleballMerchantOnboardingStatusEnum } from '@/pickleball-merchants/enums/pickleball-merchant-onboarding-status.enum';
import { PickleballMerchantListingStatusEnum } from '@/pickleball-merchants/enums/pickleball-merchant-listing-status.enum';

const createQueryBuilderMock = () => {
  const builder = {
    innerJoin: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    addGroupBy: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
    getRawMany: jest.fn(),
    getRawOne: jest.fn(),
  };

  return builder;
};

describe('PickleballLocationsService', () => {
  const pickleballLocationRepository = {
    createQueryBuilder: jest.fn(),
    findOne: jest.fn(),
  };
  const edistrictService = {
    findVisibleEdistricts: jest.fn(),
  };

  let service: PickleballLocationsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new PickleballLocationsService(
      pickleballLocationRepository as never,
      edistrictService as never,
    );
  });

  describe('findPublicLocations', () => {
    it('should keep official branches first and apply the active subscription + active venue gating to independent locations', async () => {
      const builder = createQueryBuilderMock();
      pickleballLocationRepository.createQueryBuilder.mockReturnValue(builder);
      edistrictService.findVisibleEdistricts.mockResolvedValue([
        {
          key: 'ulrak-tambayan',
          name: 'Tambayan',
          subtitle: 'Official',
          store_name: 'Ulrak Tambayan',
          seller_id: 1,
          image_url: 'official.png',
          background_image_url: null,
          status: 'active',
          display_order: 1,
          is_locked: false,
        },
      ]);
      builder.getRawMany.mockResolvedValue([
        {
          id: '12',
          key: 'partner-court',
          name: 'Partner Court',
          subtitle: null,
          store_name: 'Partner Court',
          seller_id: '45',
          image_url: null,
          background_image_url: null,
          status: 'active',
          display_order: '100',
          city: 'Cebu City',
          province: 'Cebu',
        },
      ]);

      await expect(service.findPublicLocations(null)).resolves.toEqual([
        expect.objectContaining({
          key: 'ulrak-tambayan',
          is_official: true,
          source_type: 'official_branch',
        }),
        expect.objectContaining({
          key: 'partner-court',
          seller_id: 45,
          display_order: 100,
          is_official: false,
          source_type: 'independent_merchant',
          city: 'Cebu City',
          province: 'Cebu',
        }),
      ]);

      expect(builder.innerJoin).toHaveBeenCalledWith(
        expect.anything(),
        'subscription',
        expect.stringContaining('subscription.user_id = seller.user_id'),
        expect.objectContaining({
          subscriptionStatus: SubscriptionStatusEnum.ACTIVE,
        }),
      );
      expect(builder.innerJoin).toHaveBeenCalledWith(
        expect.anything(),
        'service',
        expect.stringContaining('service.seller_id = seller.id'),
        expect.objectContaining({
          serviceType: ServiceTypeEnum.VENUE,
          serviceStatus: ServiceStatusEnum.ACTIVE,
        }),
      );
      expect(builder.andWhere).toHaveBeenCalledWith(
        'application.status = :applicationStatus',
        {
          applicationStatus: PickleballMerchantApplicationStatusEnum.COMPLETED,
        },
      );
      expect(builder.andWhere).toHaveBeenCalledWith(
        'application.owner_setup_status = :ownerSetupStatus',
        {
          ownerSetupStatus: PickleballMerchantOwnerSetupStatusEnum.COMPLETED,
        },
      );
      expect(builder.andWhere).toHaveBeenCalledWith(
        'application.subscription_payment_status = :subscriptionPaymentStatus',
        {
          subscriptionPaymentStatus:
            PickleballMerchantSubscriptionPaymentStatusEnum.APPROVED,
        },
      );
      expect(builder.andWhere).toHaveBeenCalledWith(
        'application.onboarding_status = :onboardingStatus',
        {
          onboardingStatus: PickleballMerchantOnboardingStatusEnum.COMPLETED,
        },
      );
      expect(builder.andWhere).toHaveBeenCalledWith(
        'application.listing_status = :listingStatus',
        {
          listingStatus: PickleballMerchantListingStatusEnum.PUBLIC,
        },
      );
    });
  });

  describe('resolveSellerIdForVisibleLocationKey', () => {
    it('should normalize the location key and return the visible seller id', async () => {
      const builder = createQueryBuilderMock();
      pickleballLocationRepository.createQueryBuilder.mockReturnValue(builder);
      builder.getRawOne.mockResolvedValue({ seller_id: '77' });

      await expect(
        service.resolveSellerIdForVisibleLocationKey('  Partner-Court  '),
      ).resolves.toBe(77);

      expect(builder.andWhere).toHaveBeenCalledWith('location.key = :key', {
        key: 'partner-court',
      });
    });

    it('should return null for blank location keys', async () => {
      await expect(
        service.resolveSellerIdForVisibleLocationKey('   '),
      ).resolves.toBeNull();
      expect(
        pickleballLocationRepository.createQueryBuilder,
      ).not.toHaveBeenCalled();
    });
  });
});
