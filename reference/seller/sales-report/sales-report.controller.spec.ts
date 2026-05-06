import { Test, TestingModule } from '@nestjs/testing';
import { SalesReportController } from '@/seller/sales-report/sales-report.controller';
import { SalesReportService } from '@/seller/sales-report/sales-report.service';
import { PermissionsGuard } from '@/user-permissions/user-permissions.guard';

describe('SalesReportController', () => {
  let controller: SalesReportController;
  let service: SalesReportService;

  const mockSalesReportService = {
    getSalesSummary: jest.fn(),
    getSalesRevenueChart: jest.fn(),
    getOrdersChart: jest.fn(),
    getTopCategories: jest.fn(),
    getTopProducts: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SalesReportController],
      providers: [
        {
          provide: SalesReportService,
          useValue: mockSalesReportService,
        },
      ],
    })
      .overrideGuard(PermissionsGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<SalesReportController>(SalesReportController);
    service = module.get<SalesReportService>(SalesReportService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getSummary', () => {
    it('should return sales summary', async () => {
      const mockCurrentUser = {
        id: 1,
        seller_id: 10,
        first_name: 'Seller',
        last_name: 'User',
      };
      const mockResult = {
        total_sales: 1000,
        orders_count: 10,
        products_sold: 25,
      };

      mockSalesReportService.getSalesSummary.mockResolvedValue(mockResult);

      const inputQuery = {
        start_date: '2026-01-01',
        end_date: '2026-01-31',
      };

      const result = await controller.getSummary(
        inputQuery as any,
        mockCurrentUser as any,
      );

      expect(result).toEqual(mockResult);
      expect(service.getSalesSummary).toHaveBeenCalledWith(
        inputQuery,
        mockCurrentUser,
      );
    });
  });

  describe('getRevenueChart', () => {
    it('should return revenue chart response', async () => {
      const mockCurrentUser = {
        id: 1,
        seller_id: 10,
      };
      const mockResult = {
        data: [{ date: '2026-01-01', revenue: 1000 }],
        metadata: { total_revenue: 1000 },
      };

      mockSalesReportService.getSalesRevenueChart.mockResolvedValue(mockResult);

      const inputQuery = {
        start_date: '2026-01-01',
        end_date: '2026-01-31',
        granularity: 'daily',
      };

      const result = await controller.getRevenueChart(
        inputQuery as any,
        mockCurrentUser as any,
      );

      expect(result).toEqual(mockResult);
      expect(service.getSalesRevenueChart).toHaveBeenCalledWith(
        inputQuery,
        mockCurrentUser,
      );
    });
  });

  describe('getOrdersChart', () => {
    it('should return orders chart response', async () => {
      const mockCurrentUser = {
        id: 1,
        seller_id: 10,
      };
      const mockResult = {
        data: [{ date: '2026-01-01', order_count: 5 }],
        metadata: { total_orders: 5 },
      };

      mockSalesReportService.getOrdersChart.mockResolvedValue(mockResult);

      const inputQuery = {
        start_date: '2026-01-01',
        end_date: '2026-01-31',
        granularity: 'daily',
      };

      const result = await controller.getOrdersChart(
        inputQuery as any,
        mockCurrentUser as any,
      );

      expect(result).toEqual(mockResult);
      expect(service.getOrdersChart).toHaveBeenCalledWith(
        inputQuery,
        mockCurrentUser,
      );
    });
  });

  describe('getTopCategories', () => {
    it('should return top categories response', async () => {
      const mockCurrentUser = {
        id: 1,
        seller_id: 10,
      };
      const mockResult = {
        data: [
          {
            rank: 1,
            category_id: 1,
            category_name: 'Category',
            products_count: 2,
            units_sold: 10,
            revenue: 500,
            orders_count: 3,
          },
        ],
      };

      mockSalesReportService.getTopCategories.mockResolvedValue(mockResult);

      const inputQuery = {
        start_date: '2026-01-01',
        end_date: '2026-01-31',
        sortBy: 'DESC',
      };

      const result = await controller.getTopCategories(
        inputQuery as any,
        mockCurrentUser as any,
      );

      expect(result).toEqual(mockResult);
      expect(service.getTopCategories).toHaveBeenCalledWith(
        inputQuery,
        mockCurrentUser,
      );
    });
  });

  describe('getTopProducts', () => {
    it('should return top products response', async () => {
      const mockCurrentUser = {
        id: 1,
        seller_id: 10,
      };
      const mockResult = {
        data: [
          {
            rank: 1,
            product_id: 1,
            product_name: 'Product',
            sku: 'SKU-001',
            category: 'Category',
            units_sold: 5,
            revenue: 1000,
            url: 'http://localhost:9002/media/media/file.jpg',
          },
        ],
      };

      mockSalesReportService.getTopProducts.mockResolvedValue(mockResult);

      const inputQuery = {
        start_date: '2026-01-01',
        end_date: '2026-01-31',
        sortBy: 'DESC',
      };

      const result = await controller.getTopProducts(
        inputQuery as any,
        mockCurrentUser as any,
      );

      expect(result).toEqual(mockResult);
      expect(service.getTopProducts).toHaveBeenCalledWith(
        inputQuery,
        mockCurrentUser,
      );
    });
  });
});
