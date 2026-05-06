import { Voucher } from '@/vouchers/domain/voucher';

export type FindAllVoucher = {
  data: Voucher[];
  totalCount: number;
  skip: number;
  take: number;
};
