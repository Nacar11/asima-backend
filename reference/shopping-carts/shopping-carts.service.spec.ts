import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ShoppingCartsService } from './shopping-carts.service';
import { BaseShoppingCartRepository } from './persistence/base-shopping-cart.repository';
import { BaseShoppingCartItemRepository } from './persistence/base-shopping-cart-item.repository';
import { ProductVariantEntity } from '@/product-variants/persistence/entities/product-variant.entity';
import { ProductEntity } from '@/products/persistence/entities/product.entity';
import { ShoppingCart } from './domain/shopping-cart';
import { ShoppingCartItem } from './domain/shopping-cart-item';
import { User } from '@/users/domain/user';
import { InventoryStocksService } from '@/inventory-stocks/inventory-stocks.service';
import { ServicesService } from '@/services/services.service';
import { ServicePackagesService } from '@/service-packages/service-packages.service';
import { UserAddressesService } from '@/user-addresses/user-addresses.service';
import { ServiceAreasService } from '@/service-areas/service-areas.service';
import { SellerSchedulesService } from '@/seller-schedules/seller-schedules.service';
import { CartItemAddonRepository } from '@/cart-item-addons/persistence/repositories/cart-item-addon.repository';
import { CartItemOptionRepository } from '@/cart-item-options/persistence/repositories/cart-item-option.repository';
import { ServiceAddonsService } from '@/service-addons/service-addons.service';
import { ServiceOptionGroupsService } from '@/service-option-groups/service-option-groups.service';
import { ServiceOptionPricingRulesService } from '@/service-option-pricing-rules/service-option-pricing-rules.service';
import { SellersService } from '@/sellers/sellers.service';
import { RedisHelper } from '@/utils/helpers/redis.helper';

describe('ShoppingCartsService (PRD-Compliant)', () => {
  let service: ShoppingCartsService;
  let cartRepository: jest.Mocked<BaseShoppingCartRepository>;
  let cartItemRepository: jest.Mocked<BaseShoppingCartItemRepository>;
  let variantRepository: any;

  const mockUser: User = {
    id: 1,
    first_name: 'John',
    last_name: 'Doe',
    email: 'john@example.com',
    system_admin: false,
  } as User;

  const mockCart: ShoppingCart = {
    id: 1,
    user_id: 1,
    items: [],
    created_at: new Date(),
    updated_at: new Date(),
  } as ShoppingCart;

  const mockVariant = {
    id: 1,
    sku: 'TEST-SKU',
    variant_name: 'Test Variant',
    selling_price: 100,
    minimum_order: 1,
    status: 'Active',
    product: {
      id: 1,
      product_name: 'Test Product',
      status: 'Published',
    },
  } as ProductVariantEntity;

  const mockHydratedCartItem: ShoppingCartItem = {
    id: 1,
    shopping_cart_id: 1,
    variant_id: 1,
    quantity: 2,
    is_selected: false,
    unit_price: 100,
    total_price: 200,
    variant: {
      id: 1,
      sku: 'TEST-SKU',
      variant_name: 'Test Variant',
      selling_price: 100,
      product: {
        id: 1,
        product_name: 'Test Product',
        seller_id: 10,
        store_name: 'Test Store',
      },
    },
    created_at: new Date(),
    updated_at: new Date(),
  } as ShoppingCartItem;

  beforeEach(async () => {
    const mockCartRepository = {
      findByUserId: jest.fn(),
      findSlimProductCartByUserId: jest.fn(),
      create: jest.fn(),
      findByIdWithPaginatedItems: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
    };

    const mockCartItemRepository = {
      findByCartAndVariant: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
      findById: jest.fn(),
      findByIdForCartResponse: jest.fn(),
      findByIds: jest.fn(),
      bulkUpdateSelection: jest.fn(),
      bulkSoftDelete: jest.fn(),
    };

    const mockVariantRepository = {
      findOne: jest.fn(),
    };

    const mockProductRepository = {
      findOne: jest.fn(),
    };

    const mockInventoryStocksService = {
      findByVariantId: jest.fn().mockResolvedValue({ available_quantity: 100 }),
      checkAvailability: jest.fn().mockResolvedValue(true),
      reserveStock: jest.fn(),
      releaseStock: jest.fn(),
    };

    const mockServicesService = {
      findById: jest.fn(),
    };

    const mockServicePackagesService = {
      findById: jest.fn(),
    };

    const mockUserAddressesService = {
      findMyDefaultAddress: jest.fn(),
    };

    const mockServiceAreasService = {
      findById: jest.fn(),
    };

    const mockSellerSchedulesService = {
      findById: jest.fn(),
    };

    const mockCartItemAddonRepository = {
      create: jest.fn(),
      findByCartItemId: jest.fn(),
      remove: jest.fn(),
    };

    const mockCartItemOptionRepository = {
      create: jest.fn(),
      findByCartItemId: jest.fn(),
      remove: jest.fn(),
    };

    const mockServiceAddonsService = {
      findById: jest.fn(),
      findByIds: jest.fn(),
    };

    const mockServiceOptionGroupsService = {
      findById: jest.fn(),
      findByServiceId: jest.fn(),
    };

    const mockServiceOptionPricingRulesService = {
      evaluateBestMatch: jest.fn(),
    };

    const mockSellersService = {
      findById: jest.fn(),
    };

    const mockRedisHelper = {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue('OK'),
      del: jest.fn().mockResolvedValue(1),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ShoppingCartsService,
        {
          provide: BaseShoppingCartRepository,
          useValue: mockCartRepository,
        },
        {
          provide: BaseShoppingCartItemRepository,
          useValue: mockCartItemRepository,
        },
        {
          provide: getRepositoryToken(ProductVariantEntity),
          useValue: mockVariantRepository,
        },
        {
          provide: getRepositoryToken(ProductEntity),
          useValue: mockProductRepository,
        },
        {
          provide: InventoryStocksService,
          useValue: mockInventoryStocksService,
        },
        {
          provide: ServicesService,
          useValue: mockServicesService,
        },
        {
          provide: ServicePackagesService,
          useValue: mockServicePackagesService,
        },
        {
          provide: UserAddressesService,
          useValue: mockUserAddressesService,
        },
        {
          provide: ServiceAreasService,
          useValue: mockServiceAreasService,
        },
        {
          provide: SellerSchedulesService,
          useValue: mockSellerSchedulesService,
        },
        {
          provide: CartItemAddonRepository,
          useValue: mockCartItemAddonRepository,
        },
        {
          provide: CartItemOptionRepository,
          useValue: mockCartItemOptionRepository,
        },
        {
          provide: ServiceAddonsService,
          useValue: mockServiceAddonsService,
        },
        {
          provide: ServiceOptionGroupsService,
          useValue: mockServiceOptionGroupsService,
        },
        {
          provide: ServiceOptionPricingRulesService,
          useValue: mockServiceOptionPricingRulesService,
        },
        {
          provide: SellersService,
          useValue: mockSellersService,
        },
        {
          provide: RedisHelper,
          useValue: mockRedisHelper,
        },
      ],
    }).compile();

    service = module.get<ShoppingCartsService>(ShoppingCartsService);
    cartRepository = module.get(BaseShoppingCartRepository);
    cartItemRepository = module.get(BaseShoppingCartItemRepository);
    variantRepository = module.get(getRepositoryToken(ProductVariantEntity));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getMyCart (Convenience method for cart discovery)', () => {
    it('should return existing cart for user', async () => {
      cartRepository.findSlimProductCartByUserId.mockResolvedValue(mockCart);

      const result = await service.getMyCart(mockUser);

      expect(result).toEqual(mockCart);
      expect(cartRepository.findSlimProductCartByUserId).toHaveBeenCalledWith(1);
    });

    it('should auto-create cart if user has none', async () => {
      cartRepository.findSlimProductCartByUserId.mockResolvedValue(null);
      const newCart = { ...mockCart, id: 2 };
      cartRepository.create.mockResolvedValue(newCart);

      const result = await service.getMyCart(mockUser);

      expect(result).toEqual(newCart);
      expect(cartRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: mockUser.id,
          created_by: mockUser,
          updated_by: mockUser,
        }),
      );
    });
  });

  describe('getCartByIdWithPagination (PRD: GET /api/shopping-carts/:cartId)', () => {
    it('should return cart with paginated items', async () => {
      cartRepository.findByIdWithPaginatedItems.mockResolvedValue(mockCart);

      const result = await service.getCartByIdWithPagination(1, mockUser, {
        page: 1,
        limit: 20,
      });

      expect(result).toEqual(mockCart);
      expect(cartRepository.findByIdWithPaginatedItems).toHaveBeenCalledWith(
        1,
        1,
        20,
      );
    });

    it('should throw NotFoundException if cart does not exist', async () => {
      cartRepository.findByIdWithPaginatedItems.mockResolvedValue(null);

      await expect(
        service.getCartByIdWithPagination(1, mockUser, { page: 1, limit: 20 }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user is not owner', async () => {
      const otherUserCart = { ...mockCart, user_id: 999 };
      cartRepository.findByIdWithPaginatedItems.mockResolvedValue(
        otherUserCart,
      );

      await expect(
        service.getCartByIdWithPagination(1, mockUser, { page: 1, limit: 20 }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should use default pagination (page=1, limit=20)', async () => {
      cartRepository.findByIdWithPaginatedItems.mockResolvedValue(mockCart);

      await service.getCartByIdWithPagination(1, mockUser, {
        page: 1,
        limit: 20,
      });

      expect(cartRepository.findByIdWithPaginatedItems).toHaveBeenCalledWith(
        1,
        1,
        20,
      );
    });
  });

  describe('addItem (PRD: POST /api/shopping-carts/:cartId/items)', () => {
    it('should add new item to cart and return cart summary with affected item and store', async () => {
      variantRepository.findOne.mockResolvedValue(mockVariant);
      cartRepository.findById
        .mockResolvedValueOnce(mockCart)
        .mockResolvedValueOnce({
          ...mockCart,
          items: [mockHydratedCartItem],
        });
      cartItemRepository.findByCartAndVariant.mockResolvedValue(null);
      cartItemRepository.create.mockResolvedValue(mockHydratedCartItem);
      cartItemRepository.findByIdForCartResponse.mockResolvedValue(
        mockHydratedCartItem,
      );
      cartRepository.update.mockResolvedValue(mockCart);

      const result = await service.addItem(
        1,
        { variant_id: 1, quantity: 2 },
        mockUser,
      );

      expect(cartItemRepository.create).toHaveBeenCalled();
      expect(cartItemRepository.findByIdForCartResponse).toHaveBeenCalledWith(
        mockHydratedCartItem.id,
      );
      expect(cartRepository.update).toHaveBeenCalled();
      expect(result).toHaveProperty('item_count');
      expect(result).toHaveProperty('subtotal');
      expect(result).toHaveProperty('total_amount');
      expect(result.item).toEqual(mockHydratedCartItem);
      expect(result.store).toEqual({
        seller_id: 10,
        store_name: 'Test Store',
      });
    });

    it('should increment quantity if variant already in cart', async () => {
      const existingItem = {
        id: 1,
        shopping_cart_id: 1,
        variant_id: 1,
        quantity: 2,
      } as ShoppingCartItem;

      variantRepository.findOne.mockResolvedValue(mockVariant);
      cartRepository.findById
        .mockResolvedValueOnce(mockCart)
        .mockResolvedValueOnce({
          ...mockCart,
          items: [
            {
              ...mockHydratedCartItem,
              quantity: 5,
              total_price: 500,
            },
          ],
        });
      cartItemRepository.findByCartAndVariant.mockResolvedValue(existingItem);
      cartItemRepository.update.mockResolvedValue({
        ...mockHydratedCartItem,
        quantity: 5,
        total_price: 500,
      });
      cartItemRepository.findByIdForCartResponse.mockResolvedValue({
        ...mockHydratedCartItem,
        quantity: 5,
        total_price: 500,
      });
      cartRepository.update.mockResolvedValue(mockCart);

      const result = await service.addItem(
        1,
        { variant_id: 1, quantity: 3 },
        mockUser,
      );

      expect(cartItemRepository.update).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ quantity: 5 }),
      );
      expect(result.item.quantity).toBe(5);
      expect(result.store).toEqual({
        seller_id: 10,
        store_name: 'Test Store',
      });
    });

    it('should throw NotFoundException if cart does not exist', async () => {
      variantRepository.findOne.mockResolvedValue(mockVariant);
      cartRepository.findById.mockResolvedValue(null);

      await expect(
        service.addItem(999, { variant_id: 1, quantity: 1 }, mockUser),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user does not own cart', async () => {
      const otherUserCart = { ...mockCart, user_id: 999 };
      variantRepository.findOne.mockResolvedValue(mockVariant);
      cartRepository.findById.mockResolvedValue(otherUserCart);

      await expect(
        service.addItem(1, { variant_id: 1, quantity: 1 }, mockUser),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException if variant does not exist', async () => {
      variantRepository.findOne.mockResolvedValue(null);

      await expect(
        service.addItem(1, { variant_id: 999, quantity: 1 }, mockUser),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw UnprocessableEntityException if variant is inactive', async () => {
      const inactiveVariant = { ...mockVariant, status: 'Inactive' };
      variantRepository.findOne.mockResolvedValue(inactiveVariant);

      await expect(
        service.addItem(1, { variant_id: 1, quantity: 1 }, mockUser),
      ).rejects.toThrow(UnprocessableEntityException);
    });

    it('should throw UnprocessableEntityException if product is not published', async () => {
      const draftProductVariant = {
        ...mockVariant,
        product: { ...mockVariant.product, status: 'Draft' },
      };
      variantRepository.findOne.mockResolvedValue(draftProductVariant);

      await expect(
        service.addItem(1, { variant_id: 1, quantity: 1 }, mockUser),
      ).rejects.toThrow(UnprocessableEntityException);
    });

    it('should throw BadRequestException if quantity below minimum order', async () => {
      const variantWithMinOrder = { ...mockVariant, minimum_order: 5 };
      variantRepository.findOne.mockResolvedValue(variantWithMinOrder);

      await expect(
        service.addItem(1, { variant_id: 1, quantity: 2 }, mockUser),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('updateItemQuantity (PRD: PATCH /api/shopping-carts/:cartId/items/:itemId)', () => {
    const mockCartItem: ShoppingCartItem = {
      id: 1,
      shopping_cart_id: 1,
      variant_id: 1,
      quantity: 2,
    } as ShoppingCartItem;

    it('should update item quantity', async () => {
      cartItemRepository.findById.mockResolvedValue(mockCartItem);
      cartRepository.findById.mockResolvedValue(mockCart);
      variantRepository.findOne.mockResolvedValue(mockVariant);
      cartItemRepository.update.mockResolvedValue(mockCartItem);
      cartRepository.update.mockResolvedValue(mockCart);
      cartRepository.findByIdWithPaginatedItems.mockResolvedValue({
        ...mockCart,
        items: [mockCartItem],
      });

      await service.updateItemQuantity(1, { quantity: 5 }, mockUser);

      expect(cartItemRepository.update).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ quantity: 5 }),
      );
    });

    it('should throw NotFoundException if item does not exist', async () => {
      cartItemRepository.findById.mockResolvedValue(null);

      await expect(
        service.updateItemQuantity(999, { quantity: 5 }, mockUser),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user does not own cart', async () => {
      const otherUserCart = { ...mockCart, user_id: 999 };
      cartItemRepository.findById.mockResolvedValue(mockCartItem);
      cartRepository.findById.mockResolvedValue(otherUserCart);

      await expect(
        service.updateItemQuantity(1, { quantity: 5 }, mockUser),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('removeItem (PRD: DELETE /api/shopping-carts/:cartId/items/:itemId)', () => {
    const mockCartItem: ShoppingCartItem = {
      id: 1,
      shopping_cart_id: 1,
      variant_id: 1,
      quantity: 2,
    } as ShoppingCartItem;

    it('should remove item from cart', async () => {
      cartItemRepository.findById.mockResolvedValue(mockCartItem);
      cartRepository.findById.mockResolvedValue(mockCart);
      cartItemRepository.update.mockResolvedValue(mockCartItem);
      cartItemRepository.remove.mockResolvedValue(undefined);
      cartRepository.update.mockResolvedValue(mockCart);

      const result = await service.removeItem(1, mockUser);

      expect(cartItemRepository.update).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ deleted_by: mockUser }),
      );
      expect(cartItemRepository.remove).toHaveBeenCalledWith(1);
      expect(cartRepository.findByIdWithPaginatedItems).not.toHaveBeenCalled();
      expect(result).toBeUndefined();
    });

    it('should throw NotFoundException if item does not exist', async () => {
      cartItemRepository.findById.mockResolvedValue(null);

      await expect(service.removeItem(999, mockUser)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException if user does not own cart', async () => {
      const otherUserCart = { ...mockCart, user_id: 999 };
      cartItemRepository.findById.mockResolvedValue(mockCartItem);
      cartRepository.findById.mockResolvedValue(otherUserCart);

      await expect(service.removeItem(1, mockUser)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('getCartSummary (PRD: GET /api/shopping-carts/:cartId/summary)', () => {
    it('should return cart summary', async () => {
      const cartWithSummary = {
        ...mockCart,
        summary: {
          line_count: 3,
          item_count: 3,
          subtotal: 300,
          tax_amount: 0,
          shipping_amount: 0,
          total_amount: 300,
        },
      };
      cartRepository.findById.mockResolvedValue(cartWithSummary);

      const result = await service.getCartSummary(1, mockUser);

      expect(result).toEqual(cartWithSummary.summary);
      expect(cartRepository.findById).toHaveBeenCalledWith(1, true);
    });

    it('should throw NotFoundException if cart does not exist', async () => {
      cartRepository.findById.mockResolvedValue(null);

      await expect(service.getCartSummary(999, mockUser)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException if user does not own cart', async () => {
      const otherUserCart = { ...mockCart, user_id: 999 };
      cartRepository.findById.mockResolvedValue(otherUserCart);

      await expect(service.getCartSummary(1, mockUser)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('bulkUpdateItems (PATCH /api/shopping-carts/:cartId/items/bulk-update)', () => {
    const mockCartItems: ShoppingCartItem[] = [
      {
        id: 1,
        shopping_cart_id: 1,
        variant_id: 1,
        quantity: 2,
        is_selected: false,
      } as ShoppingCartItem,
      {
        id: 2,
        shopping_cart_id: 1,
        variant_id: 2,
        quantity: 3,
        is_selected: false,
      } as ShoppingCartItem,
      {
        id: 3,
        shopping_cart_id: 1,
        variant_id: 3,
        quantity: 1,
        is_selected: true,
      } as ShoppingCartItem,
    ];

    const mockCartWithItems = {
      ...mockCart,
      items: mockCartItems,
    };

    it('should bulk update is_selected for multiple items', async () => {
      cartRepository.findById.mockResolvedValue(mockCartWithItems);
      cartItemRepository.bulkUpdateSelection.mockResolvedValue(2);
      cartRepository.update.mockResolvedValue(mockCartWithItems);

      const result = await service.bulkUpdateItems(
        1,
        { item_ids: [1, 2], is_selected: true },
        mockUser,
      );

      expect(cartItemRepository.bulkUpdateSelection).toHaveBeenCalledWith(
        [1, 2],
        true,
        mockUser.id,
      );
      expect(cartRepository.update).toHaveBeenCalledWith(1, {
        updated_by: mockUser,
      });
      expect(result).toBeUndefined();
    });

    it('should throw NotFoundException if cart does not exist', async () => {
      cartRepository.findById.mockResolvedValue(null);

      await expect(
        service.bulkUpdateItems(
          999,
          { item_ids: [1, 2], is_selected: true },
          mockUser,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user does not own cart', async () => {
      const otherUserCart = { ...mockCartWithItems, user_id: 999 };
      cartRepository.findById.mockResolvedValue(otherUserCart);

      await expect(
        service.bulkUpdateItems(
          1,
          { item_ids: [1, 2], is_selected: true },
          mockUser,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException if item IDs do not belong to cart', async () => {
      cartRepository.findById.mockResolvedValue(mockCartWithItems);

      await expect(
        service.bulkUpdateItems(
          1,
          { item_ids: [1, 999], is_selected: true },
          mockUser,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should allow admin to update items in any cart', async () => {
      const adminUser = { ...mockUser, system_admin: true };
      const otherUserCart = { ...mockCartWithItems, user_id: 999 };
      cartRepository.findById.mockResolvedValue(otherUserCart);
      cartItemRepository.bulkUpdateSelection.mockResolvedValue(2);
      cartRepository.update.mockResolvedValue(otherUserCart);

      const result = await service.bulkUpdateItems(
        1,
        { item_ids: [1, 2], is_selected: true },
        adminUser,
      );

      expect(result).toBeUndefined();
    });
  });

  describe('bulkDeleteItems (DELETE /api/shopping-carts/:cartId/items/bulk-delete)', () => {
    const mockCartItems: ShoppingCartItem[] = [
      {
        id: 1,
        shopping_cart_id: 1,
        variant_id: 1,
        quantity: 2,
        is_selected: false,
      } as ShoppingCartItem,
      {
        id: 2,
        shopping_cart_id: 1,
        variant_id: 2,
        quantity: 3,
        is_selected: false,
      } as ShoppingCartItem,
      {
        id: 3,
        shopping_cart_id: 1,
        variant_id: 3,
        quantity: 1,
        is_selected: true,
      } as ShoppingCartItem,
    ];

    const mockCartWithItems = {
      ...mockCart,
      items: mockCartItems,
    };

    it('should bulk delete multiple items', async () => {
      cartRepository.findById.mockResolvedValue(mockCartWithItems);
      cartItemRepository.bulkSoftDelete.mockResolvedValue(2);
      cartRepository.update.mockResolvedValue(mockCartWithItems);
      cartRepository.findByIdWithPaginatedItems.mockResolvedValue({
        ...mockCart,
        items: [mockCartItems[2]], // Only item 3 remains
      });

      const result = await service.bulkDeleteItems(
        1,
        { item_ids: [1, 2] },
        mockUser,
      );

      expect(cartItemRepository.bulkSoftDelete).toHaveBeenCalledWith(
        [1, 2],
        mockUser.id,
      );
      expect(cartRepository.update).toHaveBeenCalledWith(1, {
        updated_by: mockUser,
      });
      expect(result.items).toHaveLength(1);
    });

    it('should throw NotFoundException if cart does not exist', async () => {
      cartRepository.findById.mockResolvedValue(null);

      await expect(
        service.bulkDeleteItems(999, { item_ids: [1, 2] }, mockUser),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user does not own cart', async () => {
      const otherUserCart = { ...mockCartWithItems, user_id: 999 };
      cartRepository.findById.mockResolvedValue(otherUserCart);

      await expect(
        service.bulkDeleteItems(1, { item_ids: [1, 2] }, mockUser),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException if item IDs do not belong to cart', async () => {
      cartRepository.findById.mockResolvedValue(mockCartWithItems);

      await expect(
        service.bulkDeleteItems(1, { item_ids: [1, 999] }, mockUser),
      ).rejects.toThrow(BadRequestException);
    });

    it('should allow admin to delete items from any cart', async () => {
      const adminUser = { ...mockUser, system_admin: true };
      const otherUserCart = { ...mockCartWithItems, user_id: 999 };
      cartRepository.findById.mockResolvedValue(otherUserCart);
      cartItemRepository.bulkSoftDelete.mockResolvedValue(2);
      cartRepository.update.mockResolvedValue(otherUserCart);
      cartRepository.findByIdWithPaginatedItems.mockResolvedValue({
        ...mockCart,
        items: [mockCartItems[2]],
      });

      const result = await service.bulkDeleteItems(
        1,
        { item_ids: [1, 2] },
        adminUser,
      );

      expect(result.items).toHaveLength(1);
    });
  });
});
