import { CategoryEntity } from '@/categories/persistence/entities/category.entity';
import { Category } from '@/categories/domain/category';
import { getCauser } from '@/utils/helpers/entity.helper';
import { UserMapper } from '@/users/persistence/mappers/user.mapper';
import { User } from '@/users/domain/user';
import { MediaMapper } from '@/media/persistence/mappers/media.mapper';

export class CategoryMapper {
  static toDomain(raw: CategoryEntity): Category {
    const domainEntity = new Category();

    Object.assign(domainEntity, raw);
    domainEntity.product_count = 0; // Product count is calculated dynamically

    if (raw.media) {
      domainEntity.category_image = MediaMapper.toDomain(raw.media);
    }

    if (raw.seller) {
      domainEntity.seller = {
        id: raw.seller.id,
        user_id: raw.seller.user_id,
        store_name: raw.seller.store_name,
        is_verified: raw.seller.is_verified,
        is_active: raw.seller.is_active,
        status: raw.seller.status,
      };
    }

    if (raw.created_by) {
      domainEntity.created_by = getCauser(raw.created_by);
    }

    if (raw.updated_by) {
      domainEntity.updated_by = getCauser(raw.updated_by);
    }

    if (raw.deleted_by) {
      domainEntity.deleted_by = getCauser(raw.deleted_by);
    }

    return domainEntity;
  }

  static toPersistence(domainEntity: Category): CategoryEntity {
    const persistenceEntity = new CategoryEntity();
    // Exclude relation objects that would override explicit foreign key values
    // Note: parent_category may exist at runtime from Object.assign in toDomain,
    // even though it's not in the Category type definition
    const { category_image, parent_category, ...categoryWithoutRelations } =
      domainEntity as Category & { parent_category?: unknown };
    void category_image;
    void parent_category;

    Object.assign(
      persistenceEntity,
      categoryWithoutRelations as Omit<
        Category,
        | 'id'
        | 'seller'
        | 'created_by'
        | 'updated_by'
        | 'deleted_by'
        | 'category_image'
      >,
    );

    // Explicitly set parent_category relation to null when parent_category_id is null
    // This ensures TypeORM clears the relation rather than keeping the old value
    if (domainEntity.parent_category_id === null) {
      persistenceEntity.parent_category = null;
    }

    if (domainEntity.id) {
      persistenceEntity.id = domainEntity.id;
    }

    if (domainEntity.created_by) {
      persistenceEntity.created_by = UserMapper.toPersistence(
        domainEntity.created_by as User,
      );
    }

    if (domainEntity.updated_by) {
      persistenceEntity.updated_by = UserMapper.toPersistence(
        domainEntity.updated_by as User,
      );
    }

    if (domainEntity.deleted_by) {
      persistenceEntity.deleted_by = UserMapper.toPersistence(
        domainEntity.deleted_by as User,
      );
    }

    return persistenceEntity;
  }
}
