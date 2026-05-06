// src/auth/strategies/google.strategy.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { GoogleStrategy, GoogleProfile } from './google.strategy';

// Mock passport-google-oauth20 before import resolution
jest.mock('passport-google-oauth20', () => ({
  Strategy: class MockStrategy {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    constructor(_options: any, _verify: (...args: unknown[]) => unknown) {}
  },
}));

// Stub the PassportStrategy base so we don't need real OAuth config
jest.mock('@nestjs/passport', () => ({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  PassportStrategy: (_strategy: any, _name?: string) => {
    return class {
      authenticate = jest.fn();
      success = jest.fn();
      fail = jest.fn();
      error = jest.fn();
      redirect = jest.fn();
    };
  },
}));

describe('GoogleStrategy', () => {
  let strategy: GoogleStrategy;

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config: Record<string, string> = {
        'google.clientId': 'mock-client-id',
        'google.clientSecret': 'mock-client-secret',
        'google.callbackUrl':
          'http://localhost:4080/api/v1/auth/google/callback',
      };
      return config[key] ?? null;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GoogleStrategy,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    strategy = module.get<GoogleStrategy>(GoogleStrategy);
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  describe('validate', () => {
    it('should return a GoogleProfile from a valid passport profile', () => {
      const mockPassportProfile = {
        id: 'google-uid-123',
        name: { givenName: 'Jane', familyName: 'Doe' },
        emails: [{ value: 'jane.doe@example.com' }],
        photos: [{ value: 'https://lh3.googleusercontent.com/photo.jpg' }],
      };
      const done = jest.fn();

      strategy.validate(
        'access-token-abc',
        'refresh-token-xyz',
        mockPassportProfile as any,
        done,
      );

      expect(done).toHaveBeenCalledWith(null, {
        provider: 'google',
        providerId: 'google-uid-123',
        email: 'jane.doe@example.com',
        firstName: 'Jane',
        lastName: 'Doe',
        picture: 'https://lh3.googleusercontent.com/photo.jpg',
        accessToken: 'access-token-abc',
        refreshToken: 'refresh-token-xyz',
      } as GoogleProfile);
    });

    it('should use empty string for email when emails array is missing', () => {
      const mockProfile = {
        id: 'google-uid-no-email',
        name: { givenName: 'No', familyName: 'Email' },
        emails: undefined,
        photos: [],
      };
      const done = jest.fn();

      strategy.validate('token', 'refresh', mockProfile as any, done);

      expect(done).toHaveBeenCalledWith(
        null,
        expect.objectContaining({ email: '' }),
      );
    });

    it('should use empty string for firstName when givenName is missing', () => {
      const mockProfile = {
        id: 'google-uid-no-name',
        name: {},
        emails: [{ value: 'test@example.com' }],
        photos: [],
      };
      const done = jest.fn();

      strategy.validate('token', 'refresh', mockProfile as any, done);

      expect(done).toHaveBeenCalledWith(
        null,
        expect.objectContaining({ firstName: '' }),
      );
    });

    it('should use empty string for picture when photos array is empty', () => {
      const mockProfile = {
        id: 'google-uid-no-photo',
        name: { givenName: 'No', familyName: 'Photo' },
        emails: [{ value: 'test@example.com' }],
        photos: [],
      };
      const done = jest.fn();

      strategy.validate('token', 'refresh', mockProfile as any, done);

      expect(done).toHaveBeenCalledWith(
        null,
        expect.objectContaining({ picture: '' }),
      );
    });
  });
});
