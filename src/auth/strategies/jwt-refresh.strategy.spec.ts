import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtRefreshStrategy } from './jwt-refresh.strategy';
import { JwtPayloadType } from './types/jwt-payload.type';
import { UsersService } from '@/users/users.service';
import { BaseRefreshTokenRepository } from '@/auth/persistence/base-refresh-token.repository';
import { User } from '@/users/domain/user';

describe('JwtRefreshStrategy', () => {
  let strategy: JwtRefreshStrategy;
  let usersService: jest.Mocked<Pick<UsersService, 'findById'>>;
  let refreshTokens: jest.Mocked<
    Pick<BaseRefreshTokenRepository, 'findByJti' | 'revokeAllForUser'>
  >;

  const fakeUser = {
    id: 1,
    is_active: true,
    deleted_at: null,
  } as User;

  const payload = (overrides: Partial<JwtPayloadType> = {}): JwtPayloadType => ({
    id: 1,
    system_admin: false,
    jti: 'jti-1',
    iat: 0,
    exp: 0,
    ...overrides,
  });

  const future = () => new Date(Date.now() + 60_000);
  const past = () => new Date(Date.now() - 60_000);

  beforeEach(() => {
    usersService = { findById: jest.fn().mockResolvedValue(fakeUser) };
    refreshTokens = {
      findByJti: jest.fn(),
      revokeAllForUser: jest.fn().mockResolvedValue(undefined),
    };
    const configService = {
      getOrThrow: jest.fn().mockReturnValue('refresh-secret'),
    } as unknown as ConfigService;

    strategy = new JwtRefreshStrategy(
      configService,
      usersService as unknown as UsersService,
      refreshTokens as unknown as BaseRefreshTokenRepository,
    );
  });

  const req = () => ({}) as Parameters<JwtRefreshStrategy['validate']>[0];

  it('accepts an active jti, stamps it on the request, returns the user', async () => {
    refreshTokens.findByJti.mockResolvedValue({
      user_id: 1,
      expires_at: future(),
      revoked_at: null,
    });
    const request = req();

    await expect(strategy.validate(request, payload())).resolves.toBe(fakeUser);
    expect(request.refresh_jti).toBe('jti-1');
    expect(refreshTokens.revokeAllForUser).not.toHaveBeenCalled();
  });

  it('rejects a pre-ledger token (no jti claim) without touching the store', async () => {
    await expect(strategy.validate(req(), payload({ jti: undefined }))).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(refreshTokens.findByJti).not.toHaveBeenCalled();
  });

  it('rejects an unknown jti with a plain 401 — no family revocation', async () => {
    refreshTokens.findByJti.mockResolvedValue(null);

    await expect(strategy.validate(req(), payload())).rejects.toBeInstanceOf(UnauthorizedException);
    expect(refreshTokens.revokeAllForUser).not.toHaveBeenCalled();
  });

  it('REUSE: a revoked jti revokes the whole family before rejecting (ADR 0002 amended)', async () => {
    refreshTokens.findByJti.mockResolvedValue({
      user_id: 1,
      expires_at: future(),
      revoked_at: new Date(),
    });

    await expect(strategy.validate(req(), payload())).rejects.toBeInstanceOf(UnauthorizedException);
    expect(refreshTokens.revokeAllForUser).toHaveBeenCalledWith(1);
  });

  it('rejects an expired jti with a plain 401 — benign, no family revocation', async () => {
    refreshTokens.findByJti.mockResolvedValue({
      user_id: 1,
      expires_at: past(),
      revoked_at: null,
    });

    await expect(strategy.validate(req(), payload())).rejects.toBeInstanceOf(UnauthorizedException);
    expect(refreshTokens.revokeAllForUser).not.toHaveBeenCalled();
  });

  it('rejects when the user is inactive or deleted, even with an active jti', async () => {
    refreshTokens.findByJti.mockResolvedValue({
      user_id: 1,
      expires_at: future(),
      revoked_at: null,
    });
    usersService.findById.mockResolvedValue({ ...fakeUser, is_active: false } as User);

    await expect(strategy.validate(req(), payload())).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
