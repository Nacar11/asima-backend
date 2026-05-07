/**
 * Shape of the signed JWT payload for both access and refresh tokens.
 *
 * Deliberately minimal — `role.permissions` are NOT in the token. They're
 * always re-loaded by the strategy via `UsersService.findById()` so that
 * permission changes (role swap, role's permissions edited) take effect on
 * the next request rather than the next token rotation.
 *
 * `iat` / `exp` are added by `JwtService.signAsync` automatically — they're
 * declared here so the validate handler can reference them with types.
 */
export type JwtPayloadType = {
  id: number;
  system_admin: boolean;
  iat: number;
  exp: number;
};
