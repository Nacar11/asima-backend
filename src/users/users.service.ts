import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { orNotFound, unprocessable } from '@/utils/helpers/http-errors';
import { BaseUserRepository } from '@/users/persistence/base-user.repository';
import { BaseRoleRepository } from '@/roles/persistence/base-role.repository';
import { User } from '@/users/domain/user';
import { UserSearchCriteria } from '@/users/domain/user-search-criteria';
import { FindAllUser } from '@/users/domain/find-all-user';
import { CreateUserInput, UpdateUserPatch } from '@/users/domain/user-inputs';
import { BCRYPT_ROUNDS, capitalizeFirstLetter } from '@/users/users.constants';
import { BaseLeaveAllocationRepository } from '@/leave-allocations/persistence/base-leave-allocation.repository';
import {
  ALLOCATION_SOURCES,
  DEFAULT_LEAVE_ALLOCATIONS,
} from '@/leave-allocations/leave-allocations.constants';

@Injectable()
export class UsersService {
  constructor(
    private readonly repository: BaseUserRepository,
    private readonly roleRepository: BaseRoleRepository,
    private readonly allocations: BaseLeaveAllocationRepository,
  ) {}

  findAll(criteria: UserSearchCriteria): Promise<FindAllUser> {
    return this.repository.findAll(criteria);
  }

  async findById(id: number): Promise<User> {
    return orNotFound(await this.repository.findById(id), 'User', id);
  }

  findByEmail(email: string): Promise<User | null> {
    return this.repository.findByEmail(email);
  }

  async create(input: CreateUserInput): Promise<User> {
    const email = input.email.trim().toLowerCase();

    if (await this.repository.existsByEmail(email)) {
      throw unprocessable('email', `User with email '${email}' already exists`);
    }

    const role = await this.roleRepository.findById(input.role_id);
    if (!role) {
      throw unprocessable('role_id', `Unknown role id: ${input.role_id}`);
    }

    const password_hash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);

    const user = await this.repository.create({
      email,
      password_hash,
      first_name: capitalizeFirstLetter(input.first_name),
      last_name: capitalizeFirstLetter(input.last_name),
      title: input.title ?? null,
      role_id: input.role_id,
      system_admin: input.system_admin ?? false,
      is_active: input.is_active ?? true,
      created_by: input.created_by ?? null,
    });

    // Every employee starts with the default leave balances (10 vacation,
    // 10 sick). Same DEFAULT_LEAVE_ALLOCATIONS the seeder uses.
    for (const { leave_type, amount } of DEFAULT_LEAVE_ALLOCATIONS) {
      await this.allocations.create({
        employee_id: user.id,
        leave_type,
        amount,
        source: ALLOCATION_SOURCES.default,
        created_by: input.created_by ?? null,
      });
    }

    return user;
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
        throw unprocessable('role_id', `Unknown role id: ${patch.role_id}`);
      }
    }

    // Capitalize only the name fields that are actually present — an
    // omitted field means "leave unchanged", so it must not be touched.
    const normalized: UpdateUserPatch = { ...patch };
    if (normalized.first_name !== undefined) {
      normalized.first_name = capitalizeFirstLetter(normalized.first_name);
    }
    if (normalized.last_name !== undefined) {
      normalized.last_name = capitalizeFirstLetter(normalized.last_name);
    }

    return this.repository.update(id, normalized);
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
    const credentials = orNotFound(await this.repository.findByIdWithCredentials(id), 'User', id);

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
