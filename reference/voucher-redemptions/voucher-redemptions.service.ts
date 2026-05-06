import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { BaseVoucherRedemptionRepository } from '@/voucher-redemptions/persistence/base-voucher-redemption.repository';
import { QueryVoucherRedemptionDto } from '@/voucher-redemptions/dto/query-voucher-redemption.dto';
import { VoucherRedemption } from '@/voucher-redemptions/domain/voucher-redemption';
import { VoucherCategoryEntity } from '@/voucher-categories/persistence/entities/voucher-category.entity';
import { VoucherProductEntity } from '@/voucher-products/persistence/entities/voucher-product.entity';
import { VoucherServiceEntity } from '@/voucher-services/persistence/entities/voucher-service.entity';
import { VoucherServiceCategoryEntity } from '@/voucher-service-categories/persistence/entities/voucher-service-category.entity';
import { ProductCategoryEntity } from '@/product-categories/persistence/entities/product-category.entity';

@Injectable()
export class VoucherRedemptionsService {
  constructor(
    private readonly repository: BaseVoucherRedemptionRepository,
    @InjectRepository(VoucherCategoryEntity)
    private readonly voucherCategoryRepository: Repository<VoucherCategoryEntity>,
    @InjectRepository(VoucherProductEntity)
    private readonly voucherProductRepository: Repository<VoucherProductEntity>,
    @InjectRepository(VoucherServiceEntity)
    private readonly voucherServiceRepository: Repository<VoucherServiceEntity>,
    @InjectRepository(VoucherServiceCategoryEntity)
    private readonly voucherServiceCategoryRepository: Repository<VoucherServiceCategoryEntity>,
    @InjectRepository(ProductCategoryEntity)
    private readonly productCategoryRepository: Repository<ProductCategoryEntity>,
  ) {}

  async findAllForAdmin(query: QueryVoucherRedemptionDto) {
    const result = await this.repository.findAll(query, null);
    await Promise.all(
      result.data.map((redemption) => this.enrichAppliedTo(redemption)),
    );
    return result;
  }

  async findAllForSeller(query: QueryVoucherRedemptionDto, sellerId: number) {
    const result = await this.repository.findAll(query, sellerId);
    await Promise.all(
      result.data.map((redemption) => this.enrichAppliedTo(redemption)),
    );
    return result;
  }

  async findByIdForSeller(
    id: number,
    sellerId: number,
  ): Promise<VoucherRedemption | null> {
    return this.findById(id, sellerId);
  }

  async findById(
    id: number,
    sellerId?: number | null,
  ): Promise<VoucherRedemption | null> {
    const redemption = await this.repository.findById(id, sellerId);
    if (!redemption || !redemption.voucher) return redemption;

    const voucherId = redemption.voucher.id;
    const scope = redemption.voucher.scope;
    const [categories, products, services, serviceCategories] =
      await Promise.all([
        this.voucherCategoryRepository.find({
          where: { voucher_id: voucherId },
          relations: ['category'],
        }),
        this.voucherProductRepository.find({
          where: { voucher_id: voucherId },
          relations: ['product'],
        }),
        this.voucherServiceRepository.find({
          where: { voucher_id: voucherId },
          relations: ['service'],
        }),
        this.voucherServiceCategoryRepository.find({
          where: { voucher_id: voucherId },
          relations: ['service_category'],
        }),
      ]);

    redemption.voucher.voucher_categories = categories.map((item) => ({
      id: item.id,
      voucher_id: item.voucher_id,
      category_id: item.category_id,
      category_name: item.category?.category_name ?? null,
    }));
    redemption.voucher.voucher_products = products.map((item) => ({
      id: item.id,
      voucher_id: item.voucher_id,
      product_id: item.product_id,
      product_name: item.product?.product_name ?? null,
    }));
    redemption.voucher.voucher_services = services.map((item) => ({
      id: item.id,
      voucher_id: item.voucher_id,
      service_id: item.service_id,
      service_name: (item.service as any)?.title ?? null,
    }));
    redemption.voucher.voucher_service_categories = serviceCategories.map(
      (item) => ({
        id: item.id,
        voucher_id: item.voucher_id,
        service_category_id: item.service_category_id,
        service_category_name: (item.service_category as any)?.name ?? null,
      }),
    );

    await this.enrichAppliedTo(redemption);

    return redemption;
  }

  private async enrichAppliedTo(redemption: VoucherRedemption): Promise<void> {
    if (!redemption.voucher) {
      delete redemption.__order_items;
      return;
    }

    const voucherId = redemption.voucher.id;
    const scope = redemption.voucher.scope;
    const [categories, products, services, serviceCategories] =
      await Promise.all([
        this.voucherCategoryRepository.find({
          where: { voucher_id: voucherId },
        }),
        this.voucherProductRepository.find({
          where: { voucher_id: voucherId },
        }),
        this.voucherServiceRepository.find({
          where: { voucher_id: voucherId },
        }),
        this.voucherServiceCategoryRepository.find({
          where: { voucher_id: voucherId },
        }),
      ]);

    redemption.applied_to = await this.resolveAppliedTo(redemption, {
      scope,
      categoryIds: categories.map((c) => c.category_id),
      productIds: products.map((p) => p.product_id),
      serviceIds: services.map((s) => s.service_id),
      serviceCategoryIds: serviceCategories.map((sc) => sc.service_category_id),
    });

    delete redemption.__order_items;
  }

  private async resolveAppliedTo(
    redemption: VoucherRedemption,
    restrictions: {
      scope: string;
      categoryIds: number[];
      productIds: number[];
      serviceIds: number[];
      serviceCategoryIds: number[];
    },
  ): Promise<string | null> {
    // In-store: no digital transaction record
    if (!redemption.booking_id && !redemption.sales_order_id) {
      return 'In-store transaction';
    }

    // Booking: check if the booking's service matches the voucher scope
    if (redemption.booking_id) {
      // For bookings the service name is already in service_store_name
      // but we rely on the raw entity data passed through __raw
      // The booking service title was already resolved; return it
      // since the voucher was specifically applied to this booking's service
      return redemption.service_store_name ?? null;
    }

    // Sales order: filter items by the voucher's scope restrictions
    if (!redemption.__order_items?.length) return null;

    const { scope } = restrictions;

    if (scope === 'products') {
      // Only items whose product_id matches voucher_products
      const eligibleProductIds = new Set(restrictions.productIds);
      const names = redemption.__order_items
        .filter(
          (item) => item.product_id && eligibleProductIds.has(item.product_id),
        )
        .map((item) => item.variant_name ?? item.service_name)
        .filter(Boolean);
      return names.length > 0 ? names.join(', ') : null;
    }

    if (scope === 'categories') {
      // Find which products in the order belong to the voucher's categories
      const orderProductIds = redemption.__order_items
        .map((item) => item.product_id)
        .filter((pid): pid is number => pid != null);

      if (orderProductIds.length === 0) return null;

      const eligibleCategoryIds = new Set(restrictions.categoryIds);
      const productCategories = await this.productCategoryRepository.find({
        where: { product_id: In(orderProductIds) },
      });

      const eligibleProductIds = new Set(
        productCategories
          .filter((pc) => eligibleCategoryIds.has(pc.category_id))
          .map((pc) => pc.product_id),
      );

      const names = redemption.__order_items
        .filter(
          (item) => item.product_id && eligibleProductIds.has(item.product_id),
        )
        .map((item) => item.variant_name)
        .filter(Boolean);
      return names.length > 0 ? names.join(', ') : null;
    }

    if (scope === 'services') {
      const eligibleServiceIds = new Set(restrictions.serviceIds);
      const names = redemption.__order_items
        .filter(
          (item) => item.service_id && eligibleServiceIds.has(item.service_id),
        )
        .map((item) => item.service_name)
        .filter(Boolean);
      return names.length > 0 ? names.join(', ') : null;
    }

    if (scope === 'service_categories') {
      const eligibleScIds = new Set(restrictions.serviceCategoryIds);
      const names = redemption.__order_items
        .filter(
          (item) =>
            item.service_category_id &&
            eligibleScIds.has(item.service_category_id),
        )
        .map((item) => item.service_name)
        .filter(Boolean);
      return names.length > 0 ? names.join(', ') : null;
    }

    // Global/all scope — all items are eligible
    const names = redemption.__order_items
      .map((item) => item.variant_name ?? item.service_name)
      .filter(Boolean);
    return names.length > 0 ? names.join(', ') : null;
  }
}
