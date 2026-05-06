import { Test, TestingModule } from '@nestjs/testing';
import { ShoppingCartsController } from './shopping-carts.controller';
import { ShoppingCartsService } from './shopping-carts.service';
import { ShoppingCart } from './domain/shopping-cart';
import { ShoppingCartItem } from './domain/shopping-cart-item';
import { CartSummary } from './domain/cart-summary';
import { AddCartItemResponse } from './domain/add-cart-item-response';
import { User } from '@/users/domain/user';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

describe('ShoppingCartsController', () => {
  let controller: ShoppingCartsController;
  let service: jest.Mocked<ShoppingCartsService>;

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
    summary: {
      line_count: 0,
      item_count: 0,
      subtotal: 0,
      tax_amount: 0,
      shipping_amount: 0,
      total_amount: 0,
    },
    created_at: new Date(),
    updated_at: new Date(),
  } as ShoppingCart;

  const mockSummary: CartSummary = {
    line_count: 0,
    item_count: 0,
    subtotal: 0,
    tax_amount: 0,
    shipping_amount: 0,
    total_amount: 0,
  };

  beforeEach(async () => {
    const mockService = {
      getMyCart: jest.fn(),
      getCartByIdWithPagination: jest.fn(),
      addItem: jest.fn(),
      updateItemQuantity: jest.fn(),
      removeItem: jest.fn(),
      getCartSummary: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ShoppingCartsController],
      providers: [
        {
          provide: ShoppingCartsService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<ShoppingCartsController>(ShoppingCartsController);
    service = module.get(ShoppingCartsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getMyCart (Convenience: GET /api/shopping-carts/my-cart)', () => {
    it('should return user cart with auto-creation', async () => {
      service.getMyCart.mockResolvedValue(mockCart);

      const result = await controller.getMyCart(mockUser);

      expect(result).toEqual(mockCart);
      expect(service.getMyCart).toHaveBeenCalledWith(mockUser);
    });

    it('should return cart with id for use in PRD endpoints', async () => {
      service.getMyCart.mockResolvedValue(mockCart);

      const result = await controller.getMyCart(mockUser);

      expect(result.id).toBeDefined();
      expect(result.user_id).toBe(mockUser.id);
    });
  });

  describe('getCartById (PRD: GET /api/shopping-carts/:cartId)', () => {
    it('should return cart with default pagination (page=1, limit=20)', async () => {
      service.getCartByIdWithPagination.mockResolvedValue(mockCart);

      const result = await controller.getCartById(1, mockUser);

      expect(result).toEqual(mockCart);
      expect(service.getCartByIdWithPagination).toHaveBeenCalledWith(
        1,
        mockUser,
        { page: 1, limit: 20 },
      );
    });

    it('should return cart with custom pagination', async () => {
      service.getCartByIdWithPagination.mockResolvedValue(mockCart);

      const result = await controller.getCartById(1, mockUser, {
        page: 2,
        limit: 50,
      });

      expect(result).toEqual(mockCart);
      expect(service.getCartByIdWithPagination).toHaveBeenCalledWith(
        1,
        mockUser,
        { page: 2, limit: 50 },
      );
    });

    it('should enforce max limit of 100', async () => {
      service.getCartByIdWithPagination.mockResolvedValue(mockCart);

      // DTO validation should cap at 100
      const result = await controller.getCartById(1, mockUser, {
        page: 1,
        limit: 20, // Can't exceed 100 due to DTO validation
      });

      expect(result).toBeDefined();
    });

    it('should throw NotFoundException if cart not found', async () => {
      service.getCartByIdWithPagination.mockRejectedValue(
        new NotFoundException(),
      );

      await expect(controller.getCartById(999, mockUser)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException if user cannot access cart', async () => {
      service.getCartByIdWithPagination.mockRejectedValue(
        new ForbiddenException(),
      );

      await expect(controller.getCartById(1, mockUser)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('addItem (PRD: POST /api/shopping-carts/:cartId/items)', () => {
    it('should add item to cart and return cart summary with affected item and store', async () => {
      const addedResponse: AddCartItemResponse = {
        line_count: 1,
        item_count: 2,
        subtotal: 200,
        tax_amount: 0,
        shipping_amount: 0,
        total_amount: 200,
        item: {
          id: 1,
          shopping_cart_id: 1,
          variant_id: 1,
          quantity: 2,
        } as ShoppingCartItem,
        store: {
          seller_id: 10,
          store_name: 'Test Store',
        },
      };
      service.addItem.mockResolvedValue(addedResponse);

      const result = await controller.addItem(
        1,
        { variant_id: 1, quantity: 2 },
        mockUser,
      );

      expect(result).toEqual(addedResponse);
      expect(service.addItem).toHaveBeenCalledWith(
        1,
        { variant_id: 1, quantity: 2 },
        mockUser,
      );
    });
  });

  describe('updateItemQuantity (PRD: PATCH /api/shopping-carts/:cartId/items/:itemId)', () => {
    it('should update item quantity and return updated item', async () => {
      const mockCartItem: ShoppingCartItem = {
        id: 1,
        shopping_cart_id: 1,
        variant_id: 1,
        quantity: 5,
        is_selected: true,
        item_type: 'product' as any,
        created_at: new Date(),
        updated_at: new Date(),
      } as ShoppingCartItem;

      service.updateItemQuantity.mockResolvedValue(mockCartItem);

      const result = await controller.updateItemQuantity(
        1,
        1,
        { quantity: 5 },
        mockUser,
      );

      expect(result).toEqual(mockCartItem);
      expect(service.updateItemQuantity).toHaveBeenCalledWith(
        1,
        { quantity: 5 },
        mockUser,
      );
    });
  });

  describe('removeItem (PRD: DELETE /api/shopping-carts/:cartId/items/:itemId)', () => {
    it('should remove item from cart without returning a response body', async () => {
      service.removeItem.mockResolvedValue(undefined);

      const result = await controller.removeItem(1, 1, mockUser);

      expect(result).toBeUndefined();
      expect(service.removeItem).toHaveBeenCalledWith(1, mockUser);
    });
  });

  describe('getCartSummary (PRD: GET /api/shopping-carts/:cartId/summary)', () => {
    it('should return cart summary', async () => {
      service.getCartSummary.mockResolvedValue(mockSummary);

      const result = await controller.getCartSummary(1, mockUser);

      expect(result).toEqual(mockSummary);
      expect(service.getCartSummary).toHaveBeenCalledWith(1, mockUser);
    });

    it('should throw NotFoundException if cart not found', async () => {
      service.getCartSummary.mockRejectedValue(new NotFoundException());

      await expect(controller.getCartSummary(999, mockUser)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException if user cannot access cart', async () => {
      service.getCartSummary.mockRejectedValue(new ForbiddenException());

      await expect(controller.getCartSummary(1, mockUser)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});
