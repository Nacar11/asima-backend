import { InventoryStockEntity } from '../entities/inventory-stock.entity';
import { InventoryStock } from '@/inventory-stocks/domain/inventory-stock';
import { getCauser } from '@/utils/helpers/entity.helper';
import { UserMapper } from '@/users/persistence/mappers/user.mapper';
import { User } from '@/users/domain/user';

export class InventoryStockMapper {
  static toDomain(raw: InventoryStockEntity): InventoryStock {
    const domain = new InventoryStock();

    // Map primitive properties
    Object.assign(domain, {
      id: raw.id,
      variant_id: raw.variant_id,
      stock_on_hand: raw.stock_on_hand,
      stock_quantity: raw.stock_quantity,
      reserved_quantity: raw.reserved_quantity,
      available_quantity: raw.available_quantity,
      min_stock_level: raw.min_stock_level,
      last_counted_at: raw.last_counted_at,
      created_at: raw.created_at,
      updated_at: raw.updated_at,
      deleted_at: raw.deleted_at,
    });

    // Map audit relations using getCauser helper
    if (raw.created_by) {
      domain.created_by = getCauser(raw.created_by);
    }
    if (raw.updated_by) {
      domain.updated_by = getCauser(raw.updated_by);
    }
    if (raw.deleted_by) {
      domain.deleted_by = getCauser(raw.deleted_by);
    }

    return domain;
  }

  static toPersistence(domain: InventoryStock): InventoryStockEntity {
    const persistence = new InventoryStockEntity();

    // Map primitive properties, excluding ID and relations
    const primitiveData = Object.fromEntries(
      Object.entries(domain).filter(
        ([key]) =>
          ![
            'id',
            'created_by',
            'updated_by',
            'deleted_by',
            '__entity',
          ].includes(key),
      ),
    );
    Object.assign(persistence, primitiveData);

    // Map ID manually if it exists
    if (domain.id) {
      persistence.id = domain.id;
    }

    // Map User domain objects to UserEntity
    if (domain.created_by) {
      persistence.created_by = UserMapper.toPersistence(
        domain.created_by as User,
      );
    }

    if (domain.updated_by) {
      persistence.updated_by = UserMapper.toPersistence(
        domain.updated_by as User,
      );
    }

    if (domain.deleted_by) {
      persistence.deleted_by = UserMapper.toPersistence(
        domain.deleted_by as User,
      );
    }

    return persistence;
  }
}
