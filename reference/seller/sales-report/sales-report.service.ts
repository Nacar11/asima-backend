import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { User } from '@/users/domain/user';
import { BaseSalesReportRepository } from '@/seller/sales-report/persistence/base-sales-report.repository';
import { QuerySalesReportDto } from '@/seller/sales-report/dto/query-sales-report.dto';
import { SalesReportDateRange } from '@/seller/sales-report/domain/sales-report-date-range';
import { SalesReportGranularityEnum } from '@/seller/sales-report/domain/sales-report-granularity.enum';
import { SalesSummary } from '@/seller/sales-report/domain/sales-summary';
import { SalesRevenueChartResponse } from '@/seller/sales-report/domain/sales-revenue-chart-response';
import { OrdersChartResponse } from '@/seller/sales-report/domain/orders-chart-response';
import { TopCategoriesResponse } from '@/seller/sales-report/domain/top-categories-response';
import { TopProductsResponse } from '@/seller/sales-report/domain/top-products-response';

@Injectable()
export class SalesReportService {
  private readonly topLimit: number = 10;

  constructor(private readonly repository: BaseSalesReportRepository) {}

  async getSalesSummary(
    query: QuerySalesReportDto,
    user: User,
  ): Promise<SalesSummary> {
    const sellerId = this.getSellerIdFromUser(user);
    const dateRange = this.buildDateRangeFromQuery(query);
    return this.repository.getSalesSummary({ sellerId, dateRange });
  }

  async getSalesRevenueChart(
    query: QuerySalesReportDto,
    user: User,
  ): Promise<SalesRevenueChartResponse> {
    const sellerId = this.getSellerIdFromUser(user);
    const dateRange = this.buildDateRangeFromQuery(query);
    const granularity = this.buildGranularityFromQuery({ query, dateRange });
    const points = await this.repository.getSalesRevenueChart({
      sellerId,
      dateRange,
      granularity,
    });
    const totalRevenue = points.reduce((acc, p) => acc + p.revenue, 0);
    return { data: points, metadata: { total_revenue: totalRevenue } };
  }

  async getOrdersChart(
    query: QuerySalesReportDto,
    user: User,
  ): Promise<OrdersChartResponse> {
    const sellerId = this.getSellerIdFromUser(user);
    const dateRange = this.buildDateRangeFromQuery(query);
    const granularity = this.buildGranularityFromQuery({ query, dateRange });
    const points = await this.repository.getOrdersChart({
      sellerId,
      dateRange,
      granularity,
    });
    const totalOrders = points.reduce((acc, p) => acc + p.order_count, 0);
    return { data: points, metadata: { total_orders: totalOrders } };
  }

  async getTopCategories(
    query: QuerySalesReportDto,
    user: User,
  ): Promise<TopCategoriesResponse> {
    const sellerId = this.getSellerIdFromUser(user);
    const dateRange = this.buildDateRangeFromQuery(query);
    const sortOrder = query.sortBy ?? 'DESC';
    const rows = await this.repository.getTopCategories({
      sellerId,
      dateRange,
      sortOrder,
      limit: this.topLimit,
    });
    return {
      data: rows.map((row, index) => ({
        rank: index + 1,
        ...row,
      })),
    };
  }

  async getTopProducts(
    query: QuerySalesReportDto,
    user: User,
  ): Promise<TopProductsResponse> {
    const sellerId = this.getSellerIdFromUser(user);
    const dateRange = this.buildDateRangeFromQuery(query);
    const sortOrder = query.sortBy ?? 'DESC';
    const rows = await this.repository.getTopProducts({
      sellerId,
      dateRange,
      sortOrder,
      limit: this.topLimit,
    });
    return {
      data: rows.map((row, index) => ({
        rank: index + 1,
        ...row,
      })),
    };
  }

  private getSellerIdFromUser(user: User): number {
    if (!user.seller_id) {
      throw new ForbiddenException('Only sellers can access sales report');
    }
    return user.seller_id;
  }

  private buildDateRangeFromQuery(
    query: QuerySalesReportDto,
  ): SalesReportDateRange {
    const now = new Date();
    const endDateInput = query.end_date
      ? this.parseLocalDateString(query.end_date)
      : now;
    const endDate = query.end_date
      ? this.buildEndOfDay(endDateInput)
      : endDateInput;
    if (this.isInvalidDate(endDate)) {
      throw new BadRequestException('Invalid end_date');
    }
    const startDate = query.start_date
      ? this.buildStartOfDay(this.parseLocalDateString(query.start_date))
      : this.buildDefaultStartDate(endDate);
    if (this.isInvalidDate(startDate)) {
      throw new BadRequestException('Invalid start_date');
    }
    const endOfToday = this.buildEndOfDay(now);
    if (endDate.getTime() > endOfToday.getTime()) {
      throw new BadRequestException('end_date cannot be in the future');
    }
    if (endDate.getTime() < startDate.getTime()) {
      throw new BadRequestException('end_date must be after start_date');
    }
    return { startDate, endDate };
  }

  private buildDefaultStartDate(endDate: Date): Date {
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - 30);
    return this.buildStartOfDay(startDate);
  }

  private parseLocalDateString(dateString: string): Date {
    const parts = dateString.split('-');
    const year = Number(parts[0]);
    const month = Number(parts[1]);
    const day = Number(parts[2]);
    return new Date(year, month - 1, day);
  }

  private buildStartOfDay(date: Date): Date {
    return new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      0,
      0,
      0,
      0,
    );
  }

  private buildEndOfDay(date: Date): Date {
    return new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      23,
      59,
      59,
      999,
    );
  }

  private buildGranularityFromQuery(params: {
    query: QuerySalesReportDto;
    dateRange: SalesReportDateRange;
  }): SalesReportGranularityEnum {
    if (params.query.granularity) {
      return params.query.granularity;
    }
    const msPerDay = 24 * 60 * 60 * 1000;
    const diffDays =
      Math.floor(
        (params.dateRange.endDate.getTime() -
          params.dateRange.startDate.getTime()) /
          msPerDay,
      ) + 1;
    if (diffDays <= 31) {
      return SalesReportGranularityEnum.DAILY;
    }
    if (diffDays <= 90) {
      return SalesReportGranularityEnum.WEEKLY;
    }
    return SalesReportGranularityEnum.MONTHLY;
  }

  private isInvalidDate(date: Date): boolean {
    return Number.isNaN(date.getTime());
  }
}
