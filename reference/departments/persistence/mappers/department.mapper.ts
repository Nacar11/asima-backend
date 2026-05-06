import { Department } from '@/departments/domain/department';
import { DepartmentEntity } from '@/departments/persistence/entities/department.entity';
import { User } from '@/users/domain/user';
import { UserMapper } from '@/users/persistence/mappers/user.mapper';
import { getCauser, getUser } from '@/utils/helpers/entity.helper';

export class DepartmentMapper {
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
