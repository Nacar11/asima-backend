import { SalesOrderVoucherEntity } from '@/sales-order-vouchers/persistence/entities/sales-order-voucher.entity';
import { SalesOrderVoucher } from '@/sales-order-vouchers/domain/sales-order-voucher';

export class SalesOrderVoucherMapper {
  static toDomain(raw: SalesOrderVoucherEntity): SalesOrderVoucher {
    const domain: SalesOrderVoucher = {
      id: raw.id,
      sales_order_id: raw.sales_order_id,
      user_voucher_id: raw.user_voucher_id,
      voucher_code: raw.voucher_code,
      voucher_discount: Number(raw.voucher_discount),
      created_at: raw.created_at,
    };
    return domain;
  }
}
