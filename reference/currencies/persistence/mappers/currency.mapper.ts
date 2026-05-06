import { Currency } from '@/currencies/domain/currency';
import { CurrencyEntity } from '@/currencies/persistence/entities/currency.entity';

export class CurrencyMapper {
  static toDomain(raw: CurrencyEntity): Currency {
    const domain = new Currency();

    domain.id = raw.id;
    domain.code = raw.code;
    domain.name = raw.name;
    domain.symbol = raw.symbol;
    domain.exchange_rate_to_php = Number(raw.exchange_rate_to_php);
    domain.status = raw.status;

    domain.created_at = raw.created_at;
    domain.updated_at = raw.updated_at;
    domain.deleted_at = raw.deleted_at;

    return domain;
  }

  static toPersistence(domain: Currency): CurrencyEntity {
    const entity = new CurrencyEntity();

    if (domain.id) {
      entity.id = domain.id;
    }

    entity.code = domain.code;
    entity.name = domain.name;
    entity.symbol = domain.symbol ?? null;
    entity.exchange_rate_to_php = domain.exchange_rate_to_php ?? 1;
    entity.status = domain.status ?? 'Active';

    entity.created_at = domain.created_at;
    entity.updated_at = domain.updated_at;
    entity.deleted_at = domain.deleted_at ?? null;

    return entity;
  }
}
