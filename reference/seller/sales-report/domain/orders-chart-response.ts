import { OrdersChartPoint } from '@/seller/sales-report/domain/orders-chart-point';

export type OrdersChartResponse = {
  data: OrdersChartPoint[];
  metadata: {
    total_orders: number;
  };
};
