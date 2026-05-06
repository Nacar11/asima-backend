import { FindAllVoucher } from '@/vouchers/domain/find-all-voucher';
import { Voucher } from '@/vouchers/domain/voucher';
import { QueryVoucherDto } from '@/vouchers/dto/query-voucher.dto';

export abstract class BaseVoucherRepository {
  abstract create(voucher: Voucher): Promise<Voucher>;
  abstract findAll(query: QueryVoucherDto): Promise<FindAllVoucher>;
  abstract findById(id: number): Promise<Voucher | null>;
  abstract findByCode(code: string): Promise<Voucher | null>;
  abstract update(id: number, voucher: Partial<Voucher>): Promise<Voucher>;
  abstract remove(id: number): Promise<void>;
  abstract incrementUsedCount(id: number): Promise<void>;
  abstract decrementUsedCount(id: number): Promise<void>;
}
