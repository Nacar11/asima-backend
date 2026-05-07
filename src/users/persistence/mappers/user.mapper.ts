import { User } from '@/users/domain/user';
import { UserEntity } from '@/users/persistence/entities/user.entity';
import { RoleMapper } from '@/roles/persistence/mappers/role.mapper';

export class UserMapper {
  /**
   * Persistence → domain.
   *
   * Never copies `password_hash`. Even if the entity was loaded with
   * credentials (via `addSelect`), the hash stops at this layer.
   */
  static toDomain(raw: UserEntity): User {
    const user = new User();
    user.id = raw.id;
    user.email = raw.email;
    user.first_name = raw.first_name;
    user.last_name = raw.last_name;
    user.title = raw.title;
    user.role_id = raw.role_id;
    user.role = raw.role ? RoleMapper.toDomain(raw.role) : (undefined as never);
    user.system_admin = raw.system_admin;
    user.is_active = raw.is_active;
    user.last_login_at = raw.last_login_at;
    user.created_by = raw.created_by;
    user.updated_by = raw.updated_by;
    user.deleted_by = raw.deleted_by;
    user.created_at = raw.created_at;
    user.updated_at = raw.updated_at;
    user.deleted_at = raw.deleted_at;
    return user;
  }

  /**
   * Domain → persistence.
   *
   * Does NOT accept a `password_hash` (the User domain class doesn't
   * expose it). Pass the hash separately to repository methods that
   * write credentials (create / changePassword).
   */
  static toPersistence(domain: Partial<User>): UserEntity {
    const entity = new UserEntity();
    if (domain.id !== undefined) entity.id = domain.id;
    if (domain.email !== undefined) entity.email = domain.email;
    if (domain.first_name !== undefined) entity.first_name = domain.first_name;
    if (domain.last_name !== undefined) entity.last_name = domain.last_name;
    if (domain.title !== undefined) entity.title = domain.title;
    if (domain.role_id !== undefined) entity.role_id = domain.role_id;
    if (domain.system_admin !== undefined) entity.system_admin = domain.system_admin;
    if (domain.is_active !== undefined) entity.is_active = domain.is_active;
    if (domain.last_login_at !== undefined) entity.last_login_at = domain.last_login_at;
    if (domain.created_by !== undefined) entity.created_by = domain.created_by;
    if (domain.updated_by !== undefined) entity.updated_by = domain.updated_by;
    if (domain.deleted_by !== undefined) entity.deleted_by = domain.deleted_by;
    return entity;
  }
}
