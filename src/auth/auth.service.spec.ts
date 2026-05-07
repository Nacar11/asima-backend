import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';
import { BaseUserRepository } from '@/users/persistence/base-user.repository';
import { User } from '@/users/domain/user';

describe('AuthService', () => {
  let service: AuthService;
  let userRepo: jest.Mocked<Pick<BaseUserRepository, 'findByEmailWithCredentials' | 'recordLogin'>>;
  let jwtService: jest.Mocked<Pick<JwtService, 'signAsync'>>;
  let configService: jest.Mocked<Pick<ConfigService, 'getOrThrow'>>;

  const fakeUser: User = {
    id: 1,
    email: 'admin@asima.inc',
    first_name: 'Admin',
    last_name: 'Asima',
    title: null,
    role_id: 1,
    role: { id: 1, name: 'SUPER_ADMIN', permissions: [] } as never,
    system_admin: true,
    is_active: true,
    last_login_at: null,
    created_by: null,
    updated_by: null,
    deleted_by: null,
    created_at: new Date(),
    updated_at: new Date(),
    deleted_at: null,
  };

  beforeEach(() => {
    userRepo = {
      findByEmailWithCredentials: jest.fn(),
      recordLogin: jest.fn().mockResolvedValue(undefined),
    };
    jwtService = {
      signAsync: jest.fn().mockImplementation(async (_p, opts) => `signed-with-${opts.secret}`),
    };
    configService = {
      getOrThrow: jest.fn().mockImplementation((key: string) => {
        switch (key) {
          case 'auth.secret':
            return 'access-secret';
          case 'auth.refreshSecret':
            return 'refresh-secret';
          case 'auth.expires':
            return '15m';
          case 'auth.refreshExpires':
            return '7d';
          default:
            throw new Error(`unexpected key ${key}`);
        }
      }),
    };
    service = new AuthService(
      userRepo as unknown as BaseUserRepository,
      jwtService as unknown as JwtService,
      configService as unknown as ConfigService,
    );
  });

  describe('login', () => {
    it('returns tokens + user and records the login on success', async () => {
      const password_hash = await bcrypt.hash('correct-pw', 4);
      userRepo.findByEmailWithCredentials.mockResolvedValue({ user: fakeUser, password_hash });

      const result = await service.login('admin@asima.inc', 'correct-pw');

      expect(result.access_token).toBe('signed-with-access-secret');
      expect(result.refresh_token).toBe('signed-with-refresh-secret');
      expect(result.token_expires_in).toBe(900);
      expect(result.user).toBe(fakeUser);
      expect(userRepo.recordLogin).toHaveBeenCalledWith(fakeUser.id, expect.any(Date));
    });

    it('lower-cases and trims the email before lookup', async () => {
      const password_hash = await bcrypt.hash('correct-pw', 4);
      userRepo.findByEmailWithCredentials.mockResolvedValue({ user: fakeUser, password_hash });

      await service.login('  Admin@Asima.INC ', 'correct-pw');

      expect(userRepo.findByEmailWithCredentials).toHaveBeenCalledWith('admin@asima.inc');
    });

    it('throws 401 when the user is not found', async () => {
      userRepo.findByEmailWithCredentials.mockResolvedValue(null);
      await expect(service.login('x@y.z', 'pw')).rejects.toBeInstanceOf(UnauthorizedException);
      expect(userRepo.recordLogin).not.toHaveBeenCalled();
    });

    it('throws 401 when the password does not match', async () => {
      const password_hash = await bcrypt.hash('correct-pw', 4);
      userRepo.findByEmailWithCredentials.mockResolvedValue({ user: fakeUser, password_hash });

      await expect(service.login('admin@asima.inc', 'wrong-pw')).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
      expect(userRepo.recordLogin).not.toHaveBeenCalled();
    });

    it('throws 401 when the user is inactive', async () => {
      const password_hash = await bcrypt.hash('correct-pw', 4);
      userRepo.findByEmailWithCredentials.mockResolvedValue({
        user: { ...fakeUser, is_active: false },
        password_hash,
      });

      await expect(service.login('admin@asima.inc', 'correct-pw')).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('throws 401 when the user is soft-deleted', async () => {
      const password_hash = await bcrypt.hash('correct-pw', 4);
      userRepo.findByEmailWithCredentials.mockResolvedValue({
        user: { ...fakeUser, deleted_at: new Date() },
        password_hash,
      });

      await expect(service.login('admin@asima.inc', 'correct-pw')).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });
  });

  describe('refresh', () => {
    it('returns a new token pair signed with their respective secrets', async () => {
      const result = await service.refresh(fakeUser);

      expect(result.access_token).toBe('signed-with-access-secret');
      expect(result.refresh_token).toBe('signed-with-refresh-secret');
      expect(result.token_expires_in).toBe(900);
      expect(jwtService.signAsync).toHaveBeenCalledTimes(2);
    });
  });
});
