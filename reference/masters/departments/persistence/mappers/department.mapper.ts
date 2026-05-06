import { Department } from '@/masters/departments/domain/department';
import { DepartmentEntity } from '@/masters/departments/persistence/entities/department.entity';
import { User } from '@/users/domain/user';
import { UserMapper } from '@/users/persistence/mappers/user.mapper';
import { getCauser, getUser } from '@/utils/helpers/entity.helper';

/**
 * Mapper class for converting between Department domain entities and persistence entities.
 *
 * This mapper handles the bidirectional conversion between the domain layer
 * Department entities and the persistence layer DepartmentEntity entities.
 * It ensures proper mapping of relationships and audit fields while
 * maintaining data integrity across layers.
 *
 * @version 3
 * @since 1.0.0
 * @author Masters Module Team
 *
 * @example
 * ```typescript
 * // Convert persistence entity to domain entity
 * const domainDepartment = DepartmentMapper.toDomain(persistenceEntity);
 *
 * // Convert domain entity to persistence entity
 * const persistenceDepartment = DepartmentMapper.toPersistence(domainDepartment);
 * ```
 */
export class DepartmentMapper {
  /**
   * Converts a persistence entity to a domain entity.
   *
   * Maps all fields from the persistence layer to the domain layer,
   * including relationships and audit fields. Handles the conversion
   * of related entities like department_head, created_by, updated_by, and deleted_by.
   *
   * @param raw - The persistence entity to convert
   * @returns Department - The converted domain entity
   *
   * @example
   * ```typescript
   * const domainDepartment = DepartmentMapper.toDomain(persistenceEntity);
   * // Returns: { id: 1, department_code: 'IT', department_name: 'Information Technology', ... }
   * ```
   */
  static toDomain(raw: DepartmentEntity): Department {
    const domainEntity = new Department();

    Object.assign(domainEntity, raw);

    if (raw.department_head) {
      domainEntity.department_head = getUser(raw.department_head);
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
   * Converts a domain entity to a persistence entity.
   *
   * Maps all fields from the domain layer to the persistence layer,
   * including relationships and audit fields. Handles the conversion
   * of related entities like department_head, created_by, updated_by, and deleted_by.
   *
   * @param domainEntity - The domain entity to convert
   * @returns DepartmentEntity - The converted persistence entity
   *
   * @example
   * ```typescript
   * const persistenceDepartment = DepartmentMapper.toPersistence(domainDepartment);
   * // Returns: DepartmentEntity with all fields mapped from domain
   * ```
   */
  static toPersistence(domainEntity: Department): DepartmentEntity {
    const persistenceEntity = new DepartmentEntity();

    Object.assign(
      persistenceEntity,
      domainEntity as Omit<
        Department,
        'id' | 'department_head' | 'created_by' | 'updated_by' | 'deleted_by'
      >,
    );

    if (domainEntity.id) {
      persistenceEntity.id = domainEntity.id;
    }

    if (domainEntity.department_head) {
      persistenceEntity.department_head = UserMapper.toPersistence(
        domainEntity.department_head as User,
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
