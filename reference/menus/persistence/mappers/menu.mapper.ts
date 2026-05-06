import { Menu } from '@/menus/domain/menu';
import { MenuEntity } from '@/menus/persistence/entities/menu.entity';
import { getUser } from '@/utils/helpers/entity.helper';

export class MenuMapper {
  static toDomain(raw: MenuEntity): Menu {
    const domainEntity = new Menu();

    Object.assign(domainEntity, raw);

    if (raw.created_by) {
      domainEntity.created_by = getUser(raw.created_by);
    }

    if (raw.updated_by) {
      domainEntity.updated_by = getUser(raw.updated_by);
    }

    if (raw.deleted_by) {
      domainEntity.deleted_by = getUser(raw.deleted_by);
    }

    return domainEntity;
  }

  static toPersistence(domainEntity: Menu): MenuEntity {
    const persistenceEntity = new MenuEntity();
    Object.assign(persistenceEntity, domainEntity as Omit<Menu, 'id'>);

    if (domainEntity.id) {
      persistenceEntity.id = domainEntity.id;
    }

    return persistenceEntity;
  }
}
