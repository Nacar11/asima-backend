import { BadRequestException } from '@nestjs/common';
import { SalesReportService } from '@/seller/sales-report/sales-report.service';
import { BaseSalesReportRepository } from '@/seller/sales-report/persistence/base-sales-report.repository';
import { User } from '@/users/domain/user';

describe('SalesReportService', () => {
  const mockRepository: Partial<BaseSalesReportRepository> = {
    getSalesSummary: jest.fn(),
    getSalesRevenueChart: jest.fn(),
    getOrdersChart: jest.fn(),
    getTopCategories: jest.fn(),
    getTopProducts: jest.fn(),
  };

  const createService = (): SalesReportService => {
    return new SalesReportService(mockRepository as BaseSalesReportRepository);
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('buildDateRangeFromQuery', () => {
    it('should allow end_date equal to today', async () => {
      const service = createService();
      (mockRepository.getTopProducts as jest.Mock).mockResolvedValue([]);
      const now = new Date();
      const todayString = `${now.getFullYear()}-${String(
        now.getMonth() + 1,
      ).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      const inputUser = { seller_id: 1 } as unknown as User;
      await service.getTopProducts(
        { start_date: todayString, end_date: todayString, sortBy: 'DESC' },
        inputUser,
      );
      expect(mockRepository.getTopProducts).toHaveBeenCalledTimes(1);
    });

    it('should reject end_date in the future', async () => {
      const service = createService();
      (mockRepository.getTopProducts as jest.Mock).mockResolvedValue([]);
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowString = `${tomorrow.getFullYear()}-${String(
        tomorrow.getMonth() + 1,
      ).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;
      const inputUser = { seller_id: 1 } as unknown as User;

      await expect(
        service.getTopProducts(
          {
            start_date: tomorrowString,
            end_date: tomorrowString,
            sortBy: 'DESC',
          },
          inputUser,
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });
});
