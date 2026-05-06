import { SalesRevenueChartPoint } from '@/seller/sales-report/domain/sales-revenue-chart-point';

export type SalesRevenueChartResponse = {
  data: SalesRevenueChartPoint[];
  metadata: {
    total_revenue: number;
  };
};
