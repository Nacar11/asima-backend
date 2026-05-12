import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { BaseUserRepository } from '@/users/persistence/base-user.repository';
import { BaseRoleRepository } from '@/roles/persistence/base-role.repository';
import { User } from '@/users/domain/user';
import { UserSearchCriteria } from '@/users/domain/user-search-criteria';
import { FindAllUser } from '@/users/domain/find-all-user';
import { CreateUserInput, UpdateUserPatch } from '@/users/domain/user-inputs';
import { BCRYPT_ROUNDS } from '@/users/users.constants';

@Injectable()
export class UsersService {
  constructor(
    private readonly repository: BaseUserRepository,
    private readonly roleRepository: BaseRoleRepository,
  ) {}

  findAll(criteria: UserSearchCriteria): Promise<FindAllUser> {
    return this.repository.findAll(criteria);
  }

  async findById(id: number): Promise<User> {
    const user = await this.repository.findById(id);
    if (!user) throw new NotFoundException(`User with id ${id} not found`);
    return user;
  }

  findByEmail(email: string): Promise<User | null> {
    return this.repository.findByEmail(email);
  }

  async create(input: CreateUserInput): Promise<User> {
    const email = input.email.trim().toLowerCase();

    if (await this.repository.existsByEmail(email)) {
      throw new UnprocessableEntityException({
        status: 422,
        errors: { email: `User with email '${email}' already exists` },
      });
    }

    const role = await this.roleRepository.findById(input.role_id);
    if (!role) {
      throw new UnprocessableEntityException({
        status: 422,
        errors: { role_id: `Unknown role id: ${input.role_id}` },
      });
    }

    const password_hash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);

    return this.repository.create({
      email,
      password_hash,
      first_name: input.first_name,
      last_name: input.last_name,
      title: input.title ?? null,
      role_id: input.role_id,
      system_admin: input.system_admin ?? false,
      is_active: input.is_active ?? true,
      created_by: input.created_by ?? null,
    });
  }

  /**
   * Service is the sole owner of the not-found check — the repo
   * trusts the caller. `email` is intentionally NOT in `UpdateUserPatch`;
   * see `BaseUserRepository.update` for the rationale.
   */
  async update(id: number, patch: UpdateUserPatch): Promise<User> {
    await this.findById(id);

    if (patch.role_id !== undefined) {
      const role = await this.roleRepository.findById(patch.role_id);
      if (!role) {
        throw new UnprocessableEntityException({
          status: 422,
          errors: { role_id: `Unknown role id: ${patch.role_id}` },
        });
      }
    }

    return this.repository.update(id, patch);
  }

  /**
   * Admin-side force reset. NO current-password verification — the caller
   * is acting under their `USER:Update` permission, not as the target user.
   * Used by `POST /admin/users/:id/reset-password`.
   */
  async changePassword(id: number, new_password: string, updated_by: number | null): Promise<void> {
    await this.findById(id);
    const password_hash = await bcrypt.hash(new_password, BCRYPT_ROUNDS);
    await this.repository.updatePasswordHash(id, password_hash, updated_by);
  }

  /**
   * Self-service password change. Verifies the caller's current password
   * before rotating — defends against session-hijack scenarios where the
   * attacker holds the access token but not the password. Used by
   * `PATCH /users/me/password`.
   */
  async changeMyPassword(
    id: number,
    current_password: string,
    new_password: string,
  ): Promise<void> {
    const credentials = await this.repository.findByIdWithCredentials(id);
    if (!credentials) throw new NotFoundException(`User with id ${id} not found`);

    const ok = await bcrypt.compare(current_password, credentials.password_hash);
    if (!ok) throw new UnauthorizedException('Current password is incorrect');

    const password_hash = await bcrypt.hash(new_password, BCRYPT_ROUNDS);
    await this.repository.updatePasswordHash(id, password_hash, id);
  }

  async softDelete(id: number, deleted_by: number | null): Promise<void> {
    await this.findById(id);
    await this.repository.softDelete(id, deleted_by);
  }
}
