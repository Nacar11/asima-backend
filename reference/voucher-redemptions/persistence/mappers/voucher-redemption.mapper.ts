import { VoucherRedemption } from '@/voucher-redemptions/domain/voucher-redemption';
import { VoucherRedemptionEntity } from '@/voucher-redemptions/persistence/entities/voucher-redemption.entity';

export class VoucherRedemptionMapper {
  static toDomain(raw: VoucherRedemptionEntity): VoucherRedemption {
    const domain = new VoucherRedemption();
    domain.id = raw.id;
    domain.user_voucher_id = raw.user_voucher_id;
    domain.user_id = raw.user_id;
    domain.sales_order_id = raw.sales_order_id ?? null;
    domain.booking_id = raw.booking_id ?? null;
    domain.seller_id = raw.seller_id ?? null;
    domain.discount_amount = Number(raw.discount_amount);
    domain.order_subtotal = Number(raw.order_subtotal);
    domain.redeemed_at = raw.redeemed_at;
    domain.created_at = raw.created_at;
    const voucher = (raw.user_voucher as any)?.voucher;
    if (voucher) {
      domain.voucher = {
        id: voucher.id,
        code: voucher.code,
        scope: voucher.scope,
        seller_id: voucher.seller_id,
        discount_type: voucher.discount_type,
        discount_value: Number(voucher.discount_value),
      };
    }
    if (raw.user) {
      domain.user = {
        id: raw.user.id,
        first_name: (raw.user as any).first_name ?? null,
        last_name: (raw.user as any).last_name ?? null,
        email: (raw.user as any).email ?? null,
      };
    }
    if (raw.booking_id) {
      domain.channel = 'Onsite';
      domain.service_store_name =
        (raw.booking as any)?.seller?.store_name ?? null;
    } else if (raw.sales_order_id) {
      domain.channel = 'Online';
      domain.service_store_name =
        (raw.sales_order as any)?.seller?.store_name ?? null;
    } else {
      // Both null = in-store physical transaction
      domain.channel = 'Onsite';
      domain.service_store_name = (raw.seller as any)?.store_name ?? null;
    }
    domain.order_number = (raw.sales_order as any)?.order_number ?? null;
    domain.booking_number = (raw.booking as any)?.booking_number ?? null;
    domain.applied_to = null;
    // Pass raw order items for service-level applied_to filtering
    if ((raw.sales_order as any)?.items?.length) {
      domain.__order_items = (raw.sales_order as any).items.map(
        (item: any) => ({
          product_id: item.variant?.product_id ?? null,
          variant_name: item.variant?.variant_name ?? null,
          service_id: item.service_id ?? null,
          service_name: item.service?.title ?? null,
          service_category_id: item.service?.category_id ?? null,
        }),
      );
    }
    return domain;
  }

  static toPersistence(domain: VoucherRedemption): VoucherRedemptionEntity {
    const entity = new VoucherRedemptionEntity();
    if (domain.id) entity.id = domain.id;
    entity.user_voucher_id = domain.user_voucher_id;
    entity.user_id = domain.user_id;
    entity.sales_order_id = domain.sales_order_id ?? null;
    entity.booking_id = domain.booking_id ?? null;
    entity.seller_id = domain.seller_id ?? null;
    entity.discount_amount = domain.discount_amount;
    entity.order_subtotal = domain.order_subtotal;
    entity.redeemed_at = domain.redeemed_at;
    return entity;
  }
}
