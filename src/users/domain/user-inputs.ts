/**
 * Structural input types for create/update flows.
 *
 * These live in `domain/` (not inline on the service / repo) so that the
 * shape is declared ONCE. The service accepts `CreateUserInput` (carries
 * the cleartext `password`); the repo accepts `CreateUserPersistence`
 * (carries the bcrypt `password_hash`). The service hashes between the
 * two — credentials never travel as cleartext past the service layer.
 *
 * `UpdateUserPatch` is shared as-is by both: there is no privileged field
 * delta between what the service hands to the repo and what the repo
 * writes. Password changes use a dedicated method
 * (`updatePasswordHash`) and never ride here.
 */
export type CreateUserInput = {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  title?: string | null;
  role_id: number;
  system_admin?: boolean;
  is_active?: boolean;
  created_by?: number | null;
};

export type CreateUserPersistence = Omit<CreateUserInput, 'password'> & {
  password_hash: string;
};

export type UpdateUserPatch = {
  first_name?: string;
  last_name?: string;
  title?: string | null;
  role_id?: number;
  system_admin?: boolean;
  is_active?: boolean;
  updated_by?: number | null;
};
