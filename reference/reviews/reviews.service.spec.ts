import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ReviewsService } from '@/reviews/reviews.service';
import { ReviewRepository } from '@/reviews/persistence/repositories/review.repository';
import { ReviewMediaMappingRepository } from '@/media/persistence/repositories/review-media-mapping.repository';
import { BaseSalesOrderRepository } from '@/sales-orders/persistence/base-sales-order.repository';
import { MediaSellersService } from '@/media/sellers/services/media-sellers.service';
import { BookingsService } from '@/bookings/bookings.service';
import { NotificationsService } from '@/notifications/notifications.service';
import { ProductCacheService } from '@/products/product-cache.service';
import { FeaturedProductsCacheService } from '@/featured-products/featured-products-cache.service';
import { SellerEntity } from '@/sellers/persistence/entities/seller.entity';
import { ServiceEntity } from '@/services/persistence/entities/service.entity';
import { Review } from '@/reviews/domain/review';
import { SalesOrder } from '@/sales-orders/domain/sales-order';
import { SalesOrderItem } from '@/sales-orders/domain/sales-order-item';
import { OrderStatusEnum } from '@/sales-orders/domain/order-status.enum';
import { ReviewableTypeEnum } from '@/reviews/enums/reviewable-type.enum';
import { ReviewSourceTypeEnum } from '@/reviews/enums/review-source-type.enum';
import { User } from '@/users/domain/user';
import { CartItemTypeEnum } from '@/shopping-carts/enums/cart-item-type.enum';

// ─── Test Fixtures ───────────────────────────────────────────────

const mockUser = {
  id: 100,
  first_name: 'Test',
  last_name: 'Buyer',
  system_admin: false,
} as User;

const mockAdminUser = {
  id: 999,
  first_name: 'Admin',
  last_name: 'User',
  system_admin: true,
} as User;

const mockSellerUser = {
  id: 200,
  first_name: 'Seller',
  last_name: 'Owner',
  system_admin: false,
} as User;

function createMockSalesOrderItem(
  overrides?: Partial<SalesOrderItem>,
): SalesOrderItem {
  return {
    id: 10,
    order_id: 1,
    item_type: CartItemTypeEnum.PRODUCT,
    variant_id: 5,
    variant: {
      id: 5,
      sku: 'SKU-001',
      variant_name: 'Large - Red',
      product: { id: 1, product_name: 'T-Shirt' },
    },
    quantity: 1,
    unit_price: 500,
    total_price: 500,
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  } as SalesOrderItem;
}

function createMockSalesOrder(overrides?: Partial<SalesOrder>): SalesOrder {
  return {
    id: 1,
    user_id: mockUser.id,
    seller_id: 50,
    order_number: 'ORD-TEST-001',
    status: OrderStatusEnum.COMPLETED,
    subtotal: 500,
    tax_amount: 0,
    shipping_amount: 0,
    total_amount: 500,
    review_id: null,
    reviewed_at: null,
    items: [createMockSalesOrderItem()],
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  } as SalesOrder;
}

function createMockReview(overrides?: Partial<Review>): Review {
  return {
    id: 1,
    user_id: mockUser.id,
    seller_id: 50,
    product_id: 1,
    reviewable_type: ReviewableTypeEnum.PRODUCT,
    source_type: ReviewSourceTypeEnum.SALES_ORDER,
    source_id: 1,
    sales_order_item_id: 10,
    rating: 5,
    comment: 'Great product!',
    is_anonymous: false,
    is_verified_purchase: true,
    status: 'Active',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
    ...overrides,
  } as Review;
}

// ─── Mock Factories ──────────────────────────────────────────────

const mockReviewRepository = {
  findById: jest.fn(),
  findAll: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  hardDelete: jest.fn(),
  findByUserAndSalesOrderItem: jest.fn(),
  findByUserAndSalesOrder: jest.fn(),
  findByUserAndBooking: jest.fn(),
  findByService: jest.fn(),
  findBySeller: jest.fn(),
  calculateServiceRating: jest.fn(),
};

const mockReviewMediaMappingRepository = {
  createBatch: jest.fn(),
};

const mockSalesOrderRepository = {
  findSalesOrderItemByUser: jest.fn(),
  findById: jest.fn(),
  update: jest.fn(),
};

const mockMediaService = {
  createMediaFromFile: jest.fn(),
};

const mockBookingsService = {
  findById: jest.fn(),
};

const mockNotificationsService = {
  notify: jest.fn(),
};

const mockProductCacheService = {
  invalidate: jest.fn(),
};

const mockFeaturedProductsCacheService = {
  invalidateIfFeatured: jest.fn(),
};

const mockSellerRepository = {
  findOne: jest.fn(),
};

const mockServiceRepository = {
  update: jest.fn(),
};

// ─── Test Suite ──────────────────────────────────────────────────

describe('ReviewsService', () => {
  let service: ReviewsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReviewsService,
        { provide: ReviewRepository, useValue: mockReviewRepository },
        {
          provide: ReviewMediaMappingRepository,
          useValue: mockReviewMediaMappingRepository,
        },
        {
          provide: BaseSalesOrderRepository,
          useValue: mockSalesOrderRepository,
        },
        { provide: MediaSellersService, useValue: mockMediaService },
        { provide: BookingsService, useValue: mockBookingsService },
        { provide: NotificationsService, useValue: mockNotificationsService },
        { provide: ProductCacheService, useValue: mockProductCacheService },
        {
          provide: FeaturedProductsCacheService,
          useValue: mockFeaturedProductsCacheService,
        },
        {
          provide: getRepositoryToken(SellerEntity),
          useValue: mockSellerRepository,
        },
        {
          provide: getRepositoryToken(ServiceEntity),
          useValue: mockServiceRepository,
        },
      ],
    }).compile();

    service = module.get<ReviewsService>(ReviewsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── create() ────────────────────────────────────────────────

  describe('create()', () => {
    const createDto = {
      sales_order_item_id: 10,
      rating: 5,
      comment: 'Great product!',
      is_anonymous: false,
    };

    it('should create a product review successfully', async () => {
      const salesOrder = createMockSalesOrder();
      const createdReview = createMockReview();

      mockSalesOrderRepository.findSalesOrderItemByUser.mockResolvedValue(
        salesOrder,
      );
      mockReviewRepository.findByUserAndSalesOrderItem.mockResolvedValue(null);
      mockReviewRepository.create.mockResolvedValue(createdReview);
      mockSellerRepository.findOne.mockResolvedValue({
        user_id: 200,
        store_name: 'Test Store',
      });
      mockNotificationsService.notify.mockResolvedValue(undefined);

      const result = await service.create(createDto as any, mockUser);

      expect(result).toEqual(createdReview);
      // Per-item tracking: order-level review_id is no longer set on create
      expect(mockSalesOrderRepository.update).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if sales order not found', async () => {
      mockSalesOrderRepository.findSalesOrderItemByUser.mockResolvedValue(null);

      await expect(service.create(createDto as any, mockUser)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException for non-completed orders', async () => {
      const salesOrder = createMockSalesOrder({
        status: OrderStatusEnum.PENDING,
      });

      mockSalesOrderRepository.findSalesOrderItemByUser.mockResolvedValue(
        salesOrder,
      );
      mockReviewRepository.findByUserAndSalesOrderItem.mockResolvedValue(null);

      await expect(service.create(createDto as any, mockUser)).rejects.toThrow(
        BadRequestException,
      );
    });

    // ─── Item-level duplicate check ─────────────────────────────

    describe('item-level duplicate check', () => {
      it('should allow reviewing a second item in the same order', async () => {
        // Order has 2 items: item 10 (already reviewed) and item 11
        const item11 = createMockSalesOrderItem({
          id: 11,
          variant: {
            id: 6,
            sku: 'SKU-002',
            variant_name: 'Small - Blue',
            product: { id: 2, product_name: 'Pants' },
          },
        });

        const salesOrder = createMockSalesOrder({
          items: [createMockSalesOrderItem(), item11],
        });

        const createdReview = createMockReview({
          id: 2,
          sales_order_item_id: 11,
          product_id: 2,
        });

        mockSalesOrderRepository.findSalesOrderItemByUser.mockResolvedValue(
          salesOrder,
        );
        // No existing review for item 11
        mockReviewRepository.findByUserAndSalesOrderItem.mockResolvedValue(
          null,
        );
        mockReviewRepository.create.mockResolvedValue(createdReview);
        mockSellerRepository.findOne.mockResolvedValue({
          user_id: 200,
          store_name: 'Test Store',
        });

        const result = await service.create(
          { ...createDto, sales_order_item_id: 11 } as any,
          mockUser,
        );

        expect(result.id).toBe(2);
        expect(
          mockReviewRepository.findByUserAndSalesOrderItem,
        ).toHaveBeenCalledWith(mockUser.id, 11);
      });
    });

    // ─── Status hardcoding (bug #6 fix) ───────────────────────

    it('should always set status to Active regardless of input', async () => {
      const salesOrder = createMockSalesOrder();
      const createdReview = createMockReview();

      mockSalesOrderRepository.findSalesOrderItemByUser.mockResolvedValue(
        salesOrder,
      );
      mockReviewRepository.findByUserAndSalesOrderItem.mockResolvedValue(null);
      mockReviewRepository.create.mockResolvedValue(createdReview);
      mockSellerRepository.findOne.mockResolvedValue({
        user_id: 200,
        store_name: 'Test Store',
      });

      await service.create(createDto as any, mockUser);

      // Verify the review passed to create() has status 'Active'
      const reviewArg = mockReviewRepository.create.mock.calls[0][0];
      expect(reviewArg.status).toBe('Active');
    });
  });

  // ─── update() ────────────────────────────────────────────────

  describe('update()', () => {
    it('should throw NotFoundException (not generic Error) when review not found', async () => {
      mockReviewRepository.findById.mockResolvedValue(null);

      await expect(
        service.update(999, { rating: 4 } as any, mockUser),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when updating another user review', async () => {
      const otherUsersReview = createMockReview({ user_id: 999 });
      mockReviewRepository.findById.mockResolvedValue(otherUsersReview);

      await expect(
        service.update(1, { rating: 4 } as any, mockUser),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ─── replyToReview() ────────────────────────────────────────

  describe('replyToReview()', () => {
    it('should allow seller owner to reply', async () => {
      const review = createMockReview({ seller_id: 50 });
      const updatedReview = createMockReview({
        seller_id: 50,
        reply_text: 'Thanks!',
      });

      mockReviewRepository.findById.mockResolvedValue(review);
      // Seller entity: id=50, user_id=200 (mockSellerUser.id)
      mockSellerRepository.findOne.mockResolvedValue({
        id: 50,
        user_id: mockSellerUser.id,
        store_name: 'Test Store',
      });
      mockReviewRepository.update.mockResolvedValue(updatedReview);

      const result = await service.replyToReview(1, 'Thanks!', mockSellerUser);

      expect(result.reply_text).toBe('Thanks!');
    });

    it('should reject reply from non-owner user (seller_id != user_id fix)', async () => {
      const review = createMockReview({ seller_id: 50 });

      mockReviewRepository.findById.mockResolvedValue(review);
      // Seller entity: id=50 but user_id=999 (NOT mockUser.id=100)
      mockSellerRepository.findOne.mockResolvedValue({
        id: 50,
        user_id: 999,
        store_name: 'Other Store',
      });

      await expect(
        service.replyToReview(1, 'Hacking!', mockUser),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject reply if seller not found', async () => {
      const review = createMockReview({ seller_id: 50 });

      mockReviewRepository.findById.mockResolvedValue(review);
      mockSellerRepository.findOne.mockResolvedValue(null);

      await expect(service.replyToReview(1, 'Hello', mockUser)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should use correct deep link for booking-sourced reviews', async () => {
      const bookingReview = createMockReview({
        seller_id: 50,
        source_type: ReviewSourceTypeEnum.BOOKING,
        source_id: 77,
        user_id: 100,
      });
      const updatedReview = createMockReview({
        seller_id: 50,
        reply_text: 'Thanks!',
        source_type: ReviewSourceTypeEnum.BOOKING,
        source_id: 77,
      });

      mockReviewRepository.findById.mockResolvedValue(bookingReview);
      mockSellerRepository.findOne.mockResolvedValue({
        id: 50,
        user_id: mockSellerUser.id,
        store_name: 'Test Store',
      });
      mockReviewRepository.update.mockResolvedValue(updatedReview);

      await service.replyToReview(1, 'Thanks!', mockSellerUser);

      expect(mockNotificationsService.notify).toHaveBeenCalledWith(
        100,
        expect.anything(),
        expect.anything(),
        expect.anything(),
        'booking', // NOT 'order'
        77,
        '/bookings/77', // NOT '/orders/77'
      );
    });

    it('should use order deep link for sales-order-sourced reviews', async () => {
      const salesReview = createMockReview({
        seller_id: 50,
        source_type: ReviewSourceTypeEnum.SALES_ORDER,
        source_id: 88,
        user_id: 100,
      });
      const updatedReview = createMockReview({
        seller_id: 50,
        reply_text: 'Thanks!',
      });

      mockReviewRepository.findById.mockResolvedValue(salesReview);
      mockSellerRepository.findOne.mockResolvedValue({
        id: 50,
        user_id: mockSellerUser.id,
        store_name: 'Test Store',
      });
      mockReviewRepository.update.mockResolvedValue(updatedReview);

      await service.replyToReview(1, 'Thanks!', mockSellerUser);

      expect(mockNotificationsService.notify).toHaveBeenCalledWith(
        100,
        expect.anything(),
        expect.anything(),
        expect.anything(),
        'order',
        88,
        '/orders/88',
      );
    });
  });

  // ─── updateReviewStatus() ───────────────────────────────────

  describe('updateReviewStatus()', () => {
    it('should reject non-admin users', async () => {
      const review = createMockReview();
      mockReviewRepository.findById.mockResolvedValue(review);

      await expect(
        service.updateReviewStatus(1, 'Removed', mockUser),
      ).rejects.toThrow(BadRequestException);
    });

    it('should clear sales order tracking when status set to Removed', async () => {
      const review = createMockReview({
        source_type: ReviewSourceTypeEnum.SALES_ORDER,
        source_id: 1,
      });
      const updatedReview = createMockReview({ status: 'Removed' });
      const salesOrder = createMockSalesOrder({ review_id: 1 });

      mockReviewRepository.findById.mockResolvedValue(review);
      mockReviewRepository.update.mockResolvedValue(updatedReview);
      mockSalesOrderRepository.findById.mockResolvedValue(salesOrder);
      mockSalesOrderRepository.update.mockResolvedValue(salesOrder);

      await service.updateReviewStatus(1, 'Removed', mockAdminUser);

      expect(mockSalesOrderRepository.update).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ review_id: null, reviewed_at: null }),
      );
    });
  });

  // ─── remove() ───────────────────────────────────────────────

  describe('remove()', () => {
    it('should hard delete and clear tracking', async () => {
      const review = createMockReview({
        source_type: ReviewSourceTypeEnum.SALES_ORDER,
        source_id: 1,
      });
      const salesOrder = createMockSalesOrder({ review_id: 1 });

      mockReviewRepository.findById.mockResolvedValue(review);
      mockReviewRepository.hardDelete.mockResolvedValue(undefined);
      mockSalesOrderRepository.findById.mockResolvedValue(salesOrder);
      mockSalesOrderRepository.update.mockResolvedValue(salesOrder);

      await service.remove(1, mockUser);

      expect(mockReviewRepository.hardDelete).toHaveBeenCalledWith(1);
      expect(mockSalesOrderRepository.update).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ review_id: null }),
      );
    });

    it('should reject deletion by non-owner', async () => {
      const review = createMockReview({ user_id: 999 });
      mockReviewRepository.findById.mockResolvedValue(review);

      await expect(service.remove(1, mockUser)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
