import { SalesReportDateRange } from '@/seller/sales-report/domain/sales-report-date-range';
import { SalesReportGranularityEnum } from '@/seller/sales-report/domain/sales-report-granularity.enum';
import { SalesSummary } from '@/seller/sales-report/domain/sales-summary';
import { SalesRevenueChartPoint } from '@/seller/sales-report/domain/sales-revenue-chart-point';
import { OrdersChartPoint } from '@/seller/sales-report/domain/orders-chart-point';
import { TopCategoryRow } from '@/seller/sales-report/domain/top-category-row';
import { TopProductRow } from '@/seller/sales-report/domain/top-product-row';

export abstract class BaseSalesReportRepository {
  abstract getSalesSummary(params: {
    sellerId: number;
    dateRange: SalesReportDateRange;
  }): Promise<SalesSummary>;

  abstract getSalesRevenueChart(params: {
    sellerId: number;
    dateRange: SalesReportDateRange;
    granularity: SalesReportGranularityEnum;
  }): Promise<SalesRevenueChartPoint[]>;

  abstract getOrdersChart(params: {
    sellerId: number;
    dateRange: SalesReportDateRange;
    granularity: SalesReportGranularityEnum;
  }): Promise<OrdersChartPoint[]>;

  abstract getTopCategories(params: {
    sellerId: number;
    dateRange: SalesReportDateRange;
    sortOrder: 'ASC' | 'DESC';
    limit: number;
  }): Promise<Omit<TopCategoryRow, 'rank'>[]>;

  abstract getTopProducts(params: {
    sellerId: number;
    dateRange: SalesReportDateRange;
    sortOrder: 'ASC' | 'DESC';
    limit: number;
  }): Promise<Omit<TopProductRow, 'rank'>[]>;
}
