// src/auth/strategies/firebase-auth.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { FirebaseAuthService } from './firebase-auth.service';
import * as admin from 'firebase-admin';

// Mock firebase-admin at the module level
const mockVerifyIdToken = jest.fn();
const mockApp = {
  auth: jest.fn(() => ({ verifyIdToken: mockVerifyIdToken })),
};

jest.mock('firebase-admin', () => ({
  app: jest.fn(() => {
    throw new Error('No app');
  }),
  initializeApp: jest.fn(() => mockApp),
  credential: {
    cert: jest.fn(() => ({})),
  },
}));

// Mock fs so service thinks no service-account.json file exists
jest.mock('fs', () => ({
  existsSync: jest.fn(() => false),
}));

describe('FirebaseAuthService', () => {
  let service: FirebaseAuthService;

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config: Record<string, string> = {
        'firebase.projectId': 'mock-project-id',
        'firebase.privateKey': 'mock-private-key',
        'firebase.clientEmail': 'mock@project.iam.gserviceaccount.com',
      };
      return config[key] ?? null;
    }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    // Re-configure firebase-admin mock so initializeApp returns mockApp
    jest.mocked(admin.app).mockImplementation(() => {
      throw new Error('No app');
    });
    jest.mocked(admin.initializeApp).mockReturnValue(mockApp as any);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FirebaseAuthService,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<FirebaseAuthService>(FirebaseAuthService);
    // Manually trigger OnModuleInit
    await service.onModuleInit();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('verifyIdToken', () => {
    it('should return a FirebaseOAuthProfile for a valid google.com token', async () => {
      mockVerifyIdToken.mockResolvedValueOnce({
        uid: 'firebase-uid-google-123',
        email: 'jane@gmail.com',
        name: 'Jane Doe',
        picture: 'https://photo.url/jane.jpg',
        firebase: { sign_in_provider: 'google.com' },
      });

      const profile = await service.verifyIdToken('valid-google-id-token');

      expect(profile).toEqual({
        provider: 'google',
        providerId: 'firebase-uid-google-123',
        email: 'jane@gmail.com',
        firstName: 'Jane',
        lastName: 'Doe',
        picture: 'https://photo.url/jane.jpg',
        accessToken: 'valid-google-id-token',
      });
    });

    it('should return a FirebaseOAuthProfile for a valid facebook.com token', async () => {
      mockVerifyIdToken.mockResolvedValueOnce({
        uid: 'firebase-uid-fb-456',
        email: 'john@fb.com',
        name: 'John Smith',
        picture: 'https://photo.url/john.jpg',
        firebase: { sign_in_provider: 'facebook.com' },
      });

      const profile = await service.verifyIdToken('valid-facebook-id-token');

      expect(profile).toEqual({
        provider: 'facebook',
        providerId: 'firebase-uid-fb-456',
        email: 'john@fb.com',
        firstName: 'John',
        lastName: 'Smith',
        picture: 'https://photo.url/john.jpg',
        accessToken: 'valid-facebook-id-token',
      });
    });

    it('should throw UnauthorizedException for an invalid/expired token', async () => {
      mockVerifyIdToken.mockRejectedValueOnce(new Error('Token expired'));

      await expect(service.verifyIdToken('expired-token')).rejects.toThrow(
        new UnauthorizedException('Invalid or expired Firebase ID token'),
      );
    });

    it('should throw UnauthorizedException for unsupported provider (e.g., password)', async () => {
      mockVerifyIdToken.mockResolvedValueOnce({
        uid: 'firebase-uid-password',
        email: 'user@email.com',
        name: 'Password User',
        picture: '',
        firebase: { sign_in_provider: 'password' },
      });

      await expect(service.verifyIdToken('password-token')).rejects.toThrow(
        new UnauthorizedException(
          'Unsupported provider: password. Only google.com and facebook.com are allowed.',
        ),
      );
    });

    it('should handle single-word names (no lastName)', async () => {
      mockVerifyIdToken.mockResolvedValueOnce({
        uid: 'firebase-uid-mononym',
        email: 'cher@example.com',
        name: 'Cher',
        picture: '',
        firebase: { sign_in_provider: 'google.com' },
      });

      const profile = await service.verifyIdToken('single-name-token');

      expect(profile.firstName).toBe('Cher');
      expect(profile.lastName).toBe('');
    });

    it('should use empty string for email when email is missing from decoded token', async () => {
      mockVerifyIdToken.mockResolvedValueOnce({
        uid: 'firebase-uid-no-email',
        email: undefined,
        name: 'No Email',
        picture: '',
        firebase: { sign_in_provider: 'google.com' },
      });

      const profile = await service.verifyIdToken('no-email-token');
      expect(profile.email).toBe('');
    });

    it('should use empty string for picture when picture is missing', async () => {
      mockVerifyIdToken.mockResolvedValueOnce({
        uid: 'firebase-uid-no-pic',
        email: 'nopic@example.com',
        name: 'No Pic',
        picture: undefined,
        firebase: { sign_in_provider: 'google.com' },
      });

      const profile = await service.verifyIdToken('no-pic-token');
      expect(profile.picture).toBe('');
    });
  });
});
