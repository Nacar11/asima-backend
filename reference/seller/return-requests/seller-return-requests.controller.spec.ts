import { Test, TestingModule } from '@nestjs/testing';
import { SellerReturnRequestsController } from './seller-return-requests.controller';
import { ReturnRequestsService } from '@/return-requests/return-requests.service';
import { SellerSalesOrdersService } from '@/seller/sales-orders/seller-sales-orders.service';
import { ReturnRequestStatusEnum } from '@/return-requests/domain/return-request-status.enum';
import { User } from '@/users/domain/user';
import { ReturnRequest } from '@/return-requests/domain/return-request';
import { PermissionsGuard } from '@/user-permissions/user-permissions.guard';

describe('SellerReturnRequestsController', () => {
  let controller: SellerReturnRequestsController;
  let returnRequestsService: jest.Mocked<ReturnRequestsService>;
  let sellerSalesOrdersService: jest.Mocked<SellerSalesOrdersService>;

  const mockUser: User = {
    id: 1,
    email: 'seller@test.com',
    first_name: 'Test',
    last_name: 'Seller',
  } as User;

  const mockSellerId = 10;

  const mockReturnRequest: ReturnRequest = {
    id: 1,
    order_id: 100,
    user_id: 2,
    seller_id: mockSellerId,
    status: ReturnRequestStatusEnum.PENDING,
    reason: 'Defective product',
    calculated_refund_amount: 1000,
    requested_at: new Date(),
    created_at: new Date(),
    updated_at: new Date(),
  } as ReturnRequest;

  const mockPaginatedResponse = {
    data: [mockReturnRequest],
    totalCount: 1,
  };

  beforeEach(async () => {
    const mockReturnRequestsService = {
      getReturnRequestsForSellerDevExtreme: jest.fn(),
      getReturnRequestByOrderIdForSeller: jest.fn(),
      approveReturnRequest: jest.fn(),
      rejectReturnRequest: jest.fn(),
      schedulePickup: jest.fn(),
      markPickedUp: jest.fn(),
      markReturnReceived: jest.fn(),
      processRefund: jest.fn(),
    };

    const mockSellerSalesOrdersService = {
      getSellerIdForUser: jest.fn().mockResolvedValue(mockSellerId),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SellerReturnRequestsController],
      providers: [
        {
          provide: ReturnRequestsService,
          useValue: mockReturnRequestsService,
        },
        {
          provide: SellerSalesOrdersService,
          useValue: mockSellerSalesOrdersService,
        },
      ],
    })
      .overrideGuard(PermissionsGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<SellerReturnRequestsController>(
      SellerReturnRequestsController,
    );
    returnRequestsService = module.get(ReturnRequestsService);
    sellerSalesOrdersService = module.get(SellerSalesOrdersService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return paginated return requests for seller', async () => {
      returnRequestsService.getReturnRequestsForSellerDevExtreme.mockResolvedValue(
        mockPaginatedResponse,
      );

      const query = { take: 20, skip: 0 };
      const result = await controller.findAll(query, mockUser);

      expect(sellerSalesOrdersService.getSellerIdForUser).toHaveBeenCalledWith(
        mockUser,
      );
      expect(
        returnRequestsService.getReturnRequestsForSellerDevExtreme,
      ).toHaveBeenCalledWith(query, mockSellerId);
      expect(result).toEqual(mockPaginatedResponse);
    });

    it('should pass filter and sort params to service', async () => {
      returnRequestsService.getReturnRequestsForSellerDevExtreme.mockResolvedValue(
        mockPaginatedResponse,
      );

      const query = {
        take: 10,
        skip: 0,
        status: ReturnRequestStatusEnum.PENDING,
        sort: [{ selector: 'created_at', desc: true }],
      };
      await controller.findAll(query, mockUser);

      expect(
        returnRequestsService.getReturnRequestsForSellerDevExtreme,
      ).toHaveBeenCalledWith(query, mockSellerId);
    });
  });

  describe('findByOrderId', () => {
    it('should return return request for specific order', async () => {
      returnRequestsService.getReturnRequestByOrderIdForSeller.mockResolvedValue(
        mockReturnRequest,
      );

      const result = await controller.findByOrderId(100, mockUser);

      expect(sellerSalesOrdersService.getSellerIdForUser).toHaveBeenCalledWith(
        mockUser,
      );
      expect(
        returnRequestsService.getReturnRequestByOrderIdForSeller,
      ).toHaveBeenCalledWith(100, mockSellerId);
      expect(result).toEqual(mockReturnRequest);
    });

    it('should return null if no return request found', async () => {
      returnRequestsService.getReturnRequestByOrderIdForSeller.mockResolvedValue(
        null,
      );

      const result = await controller.findByOrderId(999, mockUser);

      expect(result).toBeNull();
    });
  });

  describe('approve', () => {
    it('should approve a pending return request', async () => {
      const approvedRequest = {
        ...mockReturnRequest,
        status: ReturnRequestStatusEnum.APPROVED,
      };
      returnRequestsService.approveReturnRequest.mockResolvedValue(
        approvedRequest as ReturnRequest,
      );

      const dto = { notes: 'Approved for return' };
      const result = await controller.approve(100, dto, mockUser);

      expect(sellerSalesOrdersService.getSellerIdForUser).toHaveBeenCalledWith(
        mockUser,
      );
      expect(returnRequestsService.approveReturnRequest).toHaveBeenCalledWith(
        100,
        dto,
        mockUser,
        mockSellerId,
      );
      expect(result.status).toBe(ReturnRequestStatusEnum.APPROVED);
    });
  });

  describe('reject', () => {
    it('should reject a pending return request', async () => {
      const rejectedRequest = {
        ...mockReturnRequest,
        status: ReturnRequestStatusEnum.REJECTED,
      };
      returnRequestsService.rejectReturnRequest.mockResolvedValue(
        rejectedRequest as ReturnRequest,
      );

      const dto = { rejection_reason: 'Item not eligible for return' };
      const result = await controller.reject(100, dto, mockUser);

      expect(sellerSalesOrdersService.getSellerIdForUser).toHaveBeenCalledWith(
        mockUser,
      );
      expect(returnRequestsService.rejectReturnRequest).toHaveBeenCalledWith(
        100,
        dto,
        mockUser,
        mockSellerId,
      );
      expect(result.status).toBe(ReturnRequestStatusEnum.REJECTED);
    });
  });

  describe('schedulePickup', () => {
    it('should schedule pickup for approved return', async () => {
      const scheduledRequest = {
        ...mockReturnRequest,
        status: ReturnRequestStatusEnum.PICKUP_SCHEDULED,
      };
      returnRequestsService.schedulePickup.mockResolvedValue(
        scheduledRequest as ReturnRequest,
      );

      const dto = { pickup_date: '2025-12-25', notes: 'Morning pickup' };
      const result = await controller.schedulePickup(100, dto, mockUser);

      expect(sellerSalesOrdersService.getSellerIdForUser).toHaveBeenCalledWith(
        mockUser,
      );
      expect(returnRequestsService.schedulePickup).toHaveBeenCalledWith(
        100,
        dto,
        mockUser,
        mockSellerId,
      );
      expect(result.status).toBe(ReturnRequestStatusEnum.PICKUP_SCHEDULED);
    });
  });

  describe('markPickedUp', () => {
    it('should mark return as picked up', async () => {
      const pickedUpRequest = {
        ...mockReturnRequest,
        status: ReturnRequestStatusEnum.PICKED_UP,
      };
      returnRequestsService.markPickedUp.mockResolvedValue(
        pickedUpRequest as ReturnRequest,
      );

      const dto = { notes: 'Picked up from customer' };
      const result = await controller.markPickedUp(100, dto, mockUser);

      expect(sellerSalesOrdersService.getSellerIdForUser).toHaveBeenCalledWith(
        mockUser,
      );
      expect(returnRequestsService.markPickedUp).toHaveBeenCalledWith(
        100,
        dto,
        mockUser,
        mockSellerId,
      );
      expect(result.status).toBe(ReturnRequestStatusEnum.PICKED_UP);
    });
  });

  describe('markReceived', () => {
    it('should mark return as received', async () => {
      const receivedRequest = {
        ...mockReturnRequest,
        status: ReturnRequestStatusEnum.RECEIVED,
      };
      returnRequestsService.markReturnReceived.mockResolvedValue(
        receivedRequest as ReturnRequest,
      );

      const dto = { notes: 'Received at warehouse' };
      const result = await controller.markReceived(100, dto, mockUser);

      expect(sellerSalesOrdersService.getSellerIdForUser).toHaveBeenCalledWith(
        mockUser,
      );
      expect(returnRequestsService.markReturnReceived).toHaveBeenCalledWith(
        100,
        dto,
        mockUser,
        mockSellerId,
      );
      expect(result.status).toBe(ReturnRequestStatusEnum.RECEIVED);
    });
  });

  describe('processRefund', () => {
    it('should process refund for received return', async () => {
      const refundedRequest = {
        ...mockReturnRequest,
        status: ReturnRequestStatusEnum.REFUNDED,
        actual_refund_amount: 1000,
      };
      returnRequestsService.processRefund.mockResolvedValue(
        refundedRequest as ReturnRequest,
      );

      const dto = { actual_refund_amount: 1000, refund_notes: 'Full refund' };
      const result = await controller.processRefund(100, dto, mockUser);

      expect(sellerSalesOrdersService.getSellerIdForUser).toHaveBeenCalledWith(
        mockUser,
      );
      expect(returnRequestsService.processRefund).toHaveBeenCalledWith(
        100,
        dto,
        mockUser,
        mockSellerId,
      );
      expect(result.status).toBe(ReturnRequestStatusEnum.REFUNDED);
    });

    it('should process partial refund with override', async () => {
      const refundedRequest = {
        ...mockReturnRequest,
        status: ReturnRequestStatusEnum.REFUNDED,
        actual_refund_amount: 800,
      };
      returnRequestsService.processRefund.mockResolvedValue(
        refundedRequest as ReturnRequest,
      );

      const dto = {
        actual_refund_amount: 800,
        refund_notes: 'Partial refund - item damaged by customer',
        override_amount: true,
      };
      const result = await controller.processRefund(100, dto, mockUser);

      expect(returnRequestsService.processRefund).toHaveBeenCalledWith(
        100,
        dto,
        mockUser,
        mockSellerId,
      );
      expect(result.actual_refund_amount).toBe(800);
    });
  });

  describe('seller authorization', () => {
    it('should call getSellerIdForUser for all endpoints', async () => {
      returnRequestsService.getReturnRequestsForSellerDevExtreme.mockResolvedValue(
        mockPaginatedResponse,
      );
      returnRequestsService.getReturnRequestByOrderIdForSeller.mockResolvedValue(
        mockReturnRequest,
      );
      returnRequestsService.approveReturnRequest.mockResolvedValue(
        mockReturnRequest,
      );

      await controller.findAll({ take: 20, skip: 0 }, mockUser);
      await controller.findByOrderId(100, mockUser);
      await controller.approve(100, {}, mockUser);

      expect(sellerSalesOrdersService.getSellerIdForUser).toHaveBeenCalledTimes(
        3,
      );
      expect(sellerSalesOrdersService.getSellerIdForUser).toHaveBeenCalledWith(
        mockUser,
      );
    });
  });
});
