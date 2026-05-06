import { DivisionEntity } from '@/masters/divisions/persistence/entities/division.entity';
import { Division } from '@/masters/divisions/domain/division';
import { User } from '@/users/domain/user';
import { UserMapper } from '@/users/persistence/mappers/user.mapper';
import { getCauser, getUser } from '@/utils/helpers/entity.helper';

/**
 * Mapper class for converting between division domain and persistence models.
 *
 * This mapper handles the transformation between domain objects and
 * TypeORM entities, ensuring proper data mapping and relationship
 * handling. It manages complex object conversions and maintains
 * data integrity across the domain-persistence boundary.
 *
 * The mapper includes features such as:
 * - Bidirectional domain-persistence conversion
 * - Relationship mapping with proper entity handling
 * - Audit field preservation and conversion
 * - Null safety and error handling
 * - Type-safe transformations
 *
 * @version 3
 * @since 1.0.0
 * @author Masters Module Team
 *
 * @example
 * ```typescript
 * const domainEntity = DivisionMapper.toDomain(persistenceEntity);
 * const persistenceEntity = DivisionMapper.toPersistence(domainEntity);
 * ```
 */
export class DivisionMapper {
  /**
   * Converts a persistence entity to a domain object.
   *
   * This method transforms a TypeORM entity into a domain object,
   * handling all relationship mappings and data conversions. It ensures
   * proper type safety and maintains data integrity during transformation.
   *
   * @param raw - The TypeORM entity to convert
   * @returns Division - The converted domain object
   *
   * @example
   * ```typescript
   * const domainEntity = DivisionMapper.toDomain(persistenceEntity);
   * // Returns: { id: 1, division_code: '01', division_name: 'Engineering', ... }
   * ```
   */
  static toDomain(raw: DivisionEntity): Division {
    const domainEntity = new Division();

    Object.assign(domainEntity, raw);

    if (raw.division_head) {
      domainEntity.division_head = getUser(raw.division_head);
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

  /**
   * Converts a domain object to a persistence entity.
   *
   * This method transforms a domain object into a TypeORM entity,
   * handling all relationship mappings and data conversions. It ensures
   * proper type safety and maintains data integrity during transformation.
   *
   * @param domainEntity - The domain object to convert
   * @returns DivisionEntity - The converted TypeORM entity
   *
   * @example
   * ```typescript
   * const persistenceEntity = DivisionMapper.toPersistence(domainEntity);
   * // Returns: DivisionEntity with all relationships mapped
   * ```
   */
  static toPersistence(domainEntity: Division): DivisionEntity {
    const persistenceEntity = new DivisionEntity();

    Object.assign(
      persistenceEntity,
      domainEntity as Omit<
        Division,
        'id' | 'division_head' | 'created_by' | 'updated_by' | 'deleted_by'
      >,
    );

    if (domainEntity.id) {
      persistenceEntity.id = domainEntity.id;
    }

    if (domainEntity.division_head) {
      persistenceEntity.division_head = UserMapper.toPersistence(
        domainEntity.division_head as User,
      );
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
