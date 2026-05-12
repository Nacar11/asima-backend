import { User } from '@/users/domain/user';
import { UserEntity } from '@/users/persistence/entities/user.entity';
import { RoleMapper } from '@/roles/persistence/mappers/role.mapper';

export class UserMapper {
  /**
   * Persistence → domain.
   *
   * Never copies `password_hash`. Even if the entity was loaded with
   * credentials (via `addSelect`), the hash stops at this layer.
   *
   * The mapper fails fast if `raw.role` is missing — every read path in
   * `UserRepository` joins `role` + `role.permissions`, and downstream
   * code (e.g. `MeUsersController.permissions`) relies on the relation
   * being present. A future caller that forgets the join should see
   * this error at the seam, not a `Cannot read 'permissions' of
   * undefined` further down.
   */
  static toDomain(raw: UserEntity): User {
    if (!raw.role) {
      throw new Error(
        `UserMapper.toDomain: role relation was not loaded for user id=${raw.id}. ` +
          `All read paths must join "role" and "role.permissions".`,
      );
    }

    const user = new User();
    user.id = raw.id;
    user.email = raw.email;
    user.first_name = raw.first_name;
    user.last_name = raw.last_name;
    user.title = raw.title;
    user.role_id = raw.role_id;
    user.role = RoleMapper.toDomain(raw.role);
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
}
