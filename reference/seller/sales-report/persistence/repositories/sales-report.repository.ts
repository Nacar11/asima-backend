import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseSalesReportRepository } from '@/seller/sales-report/persistence/base-sales-report.repository';
import { SalesOrderEntity } from '@/sales-orders/persistence/entities/sales-order.entity';
import { SalesOrderItemEntity } from '@/sales-orders/persistence/entities/sales-order-item.entity';
import { ProductVariantEntity } from '@/product-variants/persistence/entities/product-variant.entity';
import { ProductEntity } from '@/products/persistence/entities/product.entity';
import { ProductCategoryEntity } from '@/product-categories/persistence/entities/product-category.entity';
import { CategoryEntity } from '@/categories/persistence/entities/category.entity';
import { ProductMediaMappingEntity } from '@/media/persistence/entities/product-media-mapping.entity';
import { MediaEntity } from '@/media/persistence/entities/media.entity';
import { OrderStatusEnum } from '@/sales-orders/domain/order-status.enum';
import { SalesReportDateRange } from '@/seller/sales-report/domain/sales-report-date-range';
import { SalesReportGranularityEnum } from '@/seller/sales-report/domain/sales-report-granularity.enum';
import { SalesSummary } from '@/seller/sales-report/domain/sales-summary';
import { SalesRevenueChartPoint } from '@/seller/sales-report/domain/sales-revenue-chart-point';
import { OrdersChartPoint } from '@/seller/sales-report/domain/orders-chart-point';
import { TopCategoryRow } from '@/seller/sales-report/domain/top-category-row';
import { TopProductRow } from '@/seller/sales-report/domain/top-product-row';

@Injectable()
export class SalesReportRepository extends BaseSalesReportRepository {
  constructor(
    @InjectRepository(SalesOrderEntity)
    private readonly salesOrdersRepository: Repository<SalesOrderEntity>,
    @InjectRepository(SalesOrderItemEntity)
    private readonly salesOrderItemsRepository: Repository<SalesOrderItemEntity>,
    private readonly configService: ConfigService,
  ) {
    super();
  }

  async getSalesSummary(params: {
    sellerId: number;
    dateRange: SalesReportDateRange;
  }): Promise<SalesSummary> {
    const ordersQuery = this.salesOrdersRepository
      .createQueryBuilder('so')
      .select('COALESCE(SUM(so.total_amount), 0)', 'total_sales')
      .addSelect('COUNT(*)', 'orders_count')
      .where('so.seller_id = :sellerId', { sellerId: params.sellerId })
      .andWhere('so.status = :status', { status: OrderStatusEnum.COMPLETED })
      .andWhere('so.completed_at >= :startDate', {
        startDate: params.dateRange.startDate,
      })
      .andWhere('so.completed_at <= :endDate', {
        endDate: params.dateRange.endDate,
      });

    const productsSoldQuery = this.salesOrderItemsRepository
      .createQueryBuilder('soi')
      .select('COALESCE(SUM(soi.quantity), 0)', 'products_sold')
      .innerJoin('soi.order', 'so')
      .where('so.seller_id = :sellerId', { sellerId: params.sellerId })
      .andWhere('so.status = :status', { status: OrderStatusEnum.COMPLETED })
      .andWhere('so.completed_at >= :startDate', {
        startDate: params.dateRange.startDate,
      })
      .andWhere('so.completed_at <= :endDate', {
        endDate: params.dateRange.endDate,
      });

    const [ordersRaw, productsSoldRaw] = await Promise.all([
      ordersQuery.getRawOne<{
        total_sales: string;
        orders_count: string;
      }>(),
      productsSoldQuery.getRawOne<{ products_sold: string }>(),
    ]);

    return {
      total_sales: Number(ordersRaw?.total_sales ?? 0),
      orders_count: Number(ordersRaw?.orders_count ?? 0),
      products_sold: Number(productsSoldRaw?.products_sold ?? 0),
    };
  }

  async getSalesRevenueChart(params: {
    sellerId: number;
    dateRange: SalesReportDateRange;
    granularity: SalesReportGranularityEnum;
  }): Promise<SalesRevenueChartPoint[]> {
    const qb = this.salesOrdersRepository
      .createQueryBuilder('so')
      .select(
        this.getBucketExpression(params.granularity, 'so.completed_at'),
        'bucket',
      )
      .addSelect('COALESCE(SUM(so.total_amount), 0)', 'revenue')
      .where('so.seller_id = :sellerId', { sellerId: params.sellerId })
      .andWhere('so.status = :status', { status: OrderStatusEnum.COMPLETED })
      .andWhere('so.completed_at >= :startDate', {
        startDate: params.dateRange.startDate,
      })
      .andWhere('so.completed_at <= :endDate', {
        endDate: params.dateRange.endDate,
      })
      .groupBy('bucket')
      .orderBy('bucket', 'ASC');

    const rows = await qb.getRawMany<{ bucket: string; revenue: string }>();
    return rows.map((row) => ({
      date: String(row.bucket),
      revenue: Number(row.revenue ?? 0),
    }));
  }

  async getOrdersChart(params: {
    sellerId: number;
    dateRange: SalesReportDateRange;
    granularity: SalesReportGranularityEnum;
  }): Promise<OrdersChartPoint[]> {
    const qb = this.salesOrdersRepository
      .createQueryBuilder('so')
      .select(
        this.getBucketExpression(params.granularity, 'so.completed_at'),
        'bucket',
      )
      .addSelect('COUNT(*)', 'order_count')
      .where('so.seller_id = :sellerId', { sellerId: params.sellerId })
      .andWhere('so.status = :status', { status: OrderStatusEnum.COMPLETED })
      .andWhere('so.completed_at >= :startDate', {
        startDate: params.dateRange.startDate,
      })
      .andWhere('so.completed_at <= :endDate', {
        endDate: params.dateRange.endDate,
      })
      .groupBy('bucket')
      .orderBy('bucket', 'ASC');

    const rows = await qb.getRawMany<{ bucket: string; order_count: string }>();
    return rows.map((row) => ({
      date: String(row.bucket),
      order_count: Number(row.order_count ?? 0),
    }));
  }

  async getTopCategories(params: {
    sellerId: number;
    dateRange: SalesReportDateRange;
    sortOrder: 'ASC' | 'DESC';
    limit: number;
  }): Promise<Omit<TopCategoryRow, 'rank'>[]> {
    const qb = this.salesOrderItemsRepository
      .createQueryBuilder('soi')
      .innerJoin('soi.order', 'so')
      .innerJoin(ProductVariantEntity, 'pv', 'pv.id = soi.variant_id')
      .innerJoin(ProductEntity, 'p', 'p.id = pv.product_id')
      .innerJoin(ProductCategoryEntity, 'pc', 'pc.product_id = p.id')
      .innerJoin(CategoryEntity, 'c', 'c.id = pc.category_id')
      .select('c.id', 'category_id')
      .addSelect('c.category_name', 'category_name')
      .addSelect('COUNT(DISTINCT p.id)', 'products_count')
      .addSelect('COALESCE(SUM(soi.quantity), 0)', 'units_sold')
      .addSelect('COALESCE(SUM(soi.total_price), 0)', 'revenue')
      .addSelect('COUNT(DISTINCT so.id)', 'orders_count')
      .where('p.seller_id = :sellerId', { sellerId: params.sellerId })
      .andWhere('so.status = :status', { status: OrderStatusEnum.COMPLETED })
      .andWhere('so.completed_at >= :startDate', {
        startDate: params.dateRange.startDate,
      })
      .andWhere('so.completed_at <= :endDate', {
        endDate: params.dateRange.endDate,
      })
      .groupBy('c.id')
      .addGroupBy('c.category_name')
      .orderBy('revenue', params.sortOrder)
      .limit(params.limit);

    const rows = await qb.getRawMany<{
      category_id: string;
      category_name: string;
      products_count: string;
      units_sold: string;
      revenue: string;
      orders_count: string;
    }>();

    return rows.map((row) => ({
      category_id: Number(row.category_id),
      category_name: row.category_name,
      products_count: Number(row.products_count ?? 0),
      units_sold: Number(row.units_sold ?? 0),
      revenue: Number(row.revenue ?? 0),
      orders_count: Number(row.orders_count ?? 0),
    }));
  }

  async getTopProducts(params: {
    sellerId: number;
    dateRange: SalesReportDateRange;
    sortOrder: 'ASC' | 'DESC';
    limit: number;
  }): Promise<Omit<TopProductRow, 'rank'>[]> {
    const qb = this.salesOrderItemsRepository
      .createQueryBuilder('soi')
      .innerJoin('soi.order', 'so')
      .innerJoin(ProductVariantEntity, 'pv', 'pv.id = soi.variant_id')
      .innerJoin(ProductEntity, 'p', 'p.id = pv.product_id')
      .leftJoin(
        ProductCategoryEntity,
        'pc',
        'pc.product_id = p.id AND pc.is_primary = true',
      )
      .leftJoin(CategoryEntity, 'c', 'c.id = pc.category_id')
      .leftJoin(
        ProductMediaMappingEntity,
        'pmm',
        'pmm.product_id = p.id AND pmm.is_primary = true',
      )
      .leftJoin(MediaEntity, 'm', 'm.id = pmm.media_id')
      .select('p.id', 'product_id')
      .addSelect('p.product_name', 'product_name')
      .addSelect('pv.sku', 'sku')
      .addSelect('c.category_name', 'category')
      .addSelect('COALESCE(SUM(soi.quantity), 0)', 'units_sold')
      .addSelect('COALESCE(SUM(soi.total_price), 0)', 'revenue')
      .addSelect('m.file_path', 'file_path')
      .where('p.seller_id = :sellerId', { sellerId: params.sellerId })
      .andWhere('so.status = :status', { status: OrderStatusEnum.COMPLETED })
      .andWhere('so.completed_at >= :startDate', {
        startDate: params.dateRange.startDate,
      })
      .andWhere('so.completed_at <= :endDate', {
        endDate: params.dateRange.endDate,
      })
      .groupBy('p.id')
      .addGroupBy('p.product_name')
      .addGroupBy('pv.sku')
      .addGroupBy('c.category_name')
      .addGroupBy('m.file_path')
      .orderBy('revenue', params.sortOrder)
      .limit(params.limit);

    const rows = await qb.getRawMany<{
      product_id: string;
      product_name: string;
      sku: string;
      category: string | null;
      units_sold: string;
      revenue: string;
      file_path: string | null;
    }>();

    return rows.map((row) => ({
      product_id: Number(row.product_id),
      product_name: row.product_name,
      sku: row.sku,
      category: row.category ?? null,
      units_sold: Number(row.units_sold ?? 0),
      revenue: Number(row.revenue ?? 0),
      url: this.buildMediaUrl(row.file_path),
    }));
  }

  private buildMediaUrl(filePath: string | null): string | null {
    if (!filePath) {
      return null;
    }
    const publicEndpoint =
      this.configService.get<string>('storage.config.publicEndpoint') ||
      'http://localhost:9002';
    const bucket =
      this.configService.get<string>('storage.config.bucket') || 'media';
    const encodedPath = filePath
      .split('/')
      .map((segment) => encodeURIComponent(segment))
      .join('/');
    return `${publicEndpoint}/${bucket}/${encodedPath}`;
  }

  private getBucketExpression(
    granularity: SalesReportGranularityEnum,
    column: string,
  ): string {
    if (granularity === SalesReportGranularityEnum.DAILY) {
      return `TO_CHAR(${column}::date, 'YYYY-MM-DD')`;
    }
    if (granularity === SalesReportGranularityEnum.WEEKLY) {
      return `TO_CHAR((DATE_TRUNC('day', ${column}) - (EXTRACT(DOW FROM ${column}) * INTERVAL '1 day'))::date, 'YYYY-MM-DD')`;
    }
    return `TO_CHAR(DATE_TRUNC('month', ${column})::date, 'YYYY-MM-DD')`;
  }
}
