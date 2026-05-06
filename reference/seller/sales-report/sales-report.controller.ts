import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '@/utils/decorators/current-user.decorator';
import { User } from '@/users/domain/user';
import { PermissionsGuard } from '@/user-permissions/user-permissions.guard';
import { Permissions } from '@/user-permissions/persistence/user-permissions.decorator';
import { SalesReportService } from '@/seller/sales-report/sales-report.service';
import { QuerySalesReportDto } from '@/seller/sales-report/dto/query-sales-report.dto';
import { SalesSummary } from '@/seller/sales-report/domain/sales-summary';
import { SalesRevenueChartResponse } from '@/seller/sales-report/domain/sales-revenue-chart-response';
import { OrdersChartResponse } from '@/seller/sales-report/domain/orders-chart-response';
import { TopCategoriesResponse } from '@/seller/sales-report/domain/top-categories-response';
import { TopProductsResponse } from '@/seller/sales-report/domain/top-products-response';

@ApiTags('Seller - Sales Report')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
@Controller({
  path: 'seller/sales',
  version: '1',
})
export class SalesReportController {
  constructor(private readonly service: SalesReportService) {}

  @Get('summary')
  @Permissions({ SM09: 'View' })
  @ApiOperation({
    summary: 'Get sales summary widgets data',
    description:
      'Returns total_sales, orders_count, and products_sold for completed orders within date range.',
  })
  @ApiResponse({ status: 200, type: Object })
  getSummary(
    @Query() query: QuerySalesReportDto,
    @CurrentUser() user: User,
  ): Promise<SalesSummary> {
    return this.service.getSalesSummary(query, user);
  }

  @Get('revenue-chart')
  @Permissions({ SM09: 'View' })
  @ApiOperation({
    summary: 'Get sales revenue chart data',
    description:
      'Returns revenue time series for completed orders within date range.',
  })
  @ApiResponse({ status: 200, type: Object })
  getRevenueChart(
    @Query() query: QuerySalesReportDto,
    @CurrentUser() user: User,
  ): Promise<SalesRevenueChartResponse> {
    return this.service.getSalesRevenueChart(query, user);
  }

  @Get('orders-chart')
  @Permissions({ SM09: 'View' })
  @ApiOperation({
    summary: 'Get order count chart data',
    description:
      'Returns order_count time series for completed orders within date range.',
  })
  @ApiResponse({ status: 200, type: Object })
  getOrdersChart(
    @Query() query: QuerySalesReportDto,
    @CurrentUser() user: User,
  ): Promise<OrdersChartResponse> {
    return this.service.getOrdersChart(query, user);
  }

  @Get('top-categories')
  @Permissions({ SM09: 'View' })
  @ApiOperation({
    summary: 'Get top performing categories',
    description:
      'Returns ranked categories by revenue for completed orders within date range.',
  })
  @ApiResponse({ status: 200, type: Object })
  getTopCategories(
    @Query() query: QuerySalesReportDto,
    @CurrentUser() user: User,
  ): Promise<TopCategoriesResponse> {
    return this.service.getTopCategories(query, user);
  }

  @Get('top-products')
  @Permissions({ SM09: 'View' })
  @ApiOperation({
    summary: 'Get top performing products',
    description:
      'Returns ranked products by revenue for completed orders within date range.',
  })
  @ApiResponse({ status: 200, type: Object })
  getTopProducts(
    @Query() query: QuerySalesReportDto,
    @CurrentUser() user: User,
  ): Promise<TopProductsResponse> {
    return this.service.getTopProducts(query, user);
  }
}
