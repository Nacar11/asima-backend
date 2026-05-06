import { Currency } from '@/currencies/domain/currency';
import { NullableType } from '@/utils/types/nullable.type';

export abstract class BaseCurrencyRepository {
  abstract create(
    data: Omit<Currency, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>,
  ): Promise<Currency>;

  abstract findAll(params: {
    search?: string;
    skip?: number;
    take?: number;
    status?: string;
  }): Promise<{ data: Currency[]; totalCount: number }>;

  abstract findById(id: Currency['id']): Promise<NullableType<Currency>>;

  abstract findByCode(code: Currency['code']): Promise<NullableType<Currency>>;

  abstract update(
    id: Currency['id'],
    payload: Partial<Currency>,
  ): Promise<Currency>;

  abstract remove(id: Currency['id'], causerId?: number): Promise<void>;
}
