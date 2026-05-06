// src/auth/strategies/google-mock.strategy.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { GoogleMockService } from './google-mock.strategy';

describe('GoogleMockService', () => {
  let service: GoogleMockService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GoogleMockService],
    }).compile();

    service = module.get<GoogleMockService>(GoogleMockService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateMockProfile', () => {
    it('should generate profile with default values when no params provided', () => {
      const profile = service.generateMockProfile({});

      expect(profile.provider).toBe('google');
      expect(profile.email).toBe('test.user@example.com');
      expect(profile.firstName).toBe('Test');
      expect(profile.lastName).toBe('User');
      expect(profile.providerId).toBe('mock-google-id-12345');
      expect(profile.picture).toBe('https://via.placeholder.com/150');
      expect(profile.accessToken).toBeDefined();
      expect(profile.refreshToken).toBeDefined();
    });

    it('should use custom email from query params', () => {
      const profile = service.generateMockProfile({
        email: 'custom@example.com',
      });
      expect(profile.email).toBe('custom@example.com');
    });

    it('should use custom firstName from query params', () => {
      const profile = service.generateMockProfile({ firstName: 'Jane' });
      expect(profile.firstName).toBe('Jane');
    });

    it('should use custom lastName from query params', () => {
      const profile = service.generateMockProfile({ lastName: 'Smith' });
      expect(profile.lastName).toBe('Smith');
    });

    it('should use custom providerId from query params', () => {
      const profile = service.generateMockProfile({
        providerId: 'custom-google-id-999',
      });
      expect(profile.providerId).toBe('custom-google-id-999');
    });

    it('should generate unique access tokens across calls', async () => {
      const profile1 = service.generateMockProfile({});
      await new Promise((r) => setTimeout(r, 10));
      const profile2 = service.generateMockProfile({});
      expect(profile1.accessToken).not.toBe(profile2.accessToken);
    });
  });

  describe('getTestUser', () => {
    it('should return new scenario with unique email and providerId', () => {
      const profile1 = service.getTestUser('new');
      const profile2 = service.getTestUser('new');
      expect(profile1.email).not.toBe(profile2.email);
      expect(profile1.providerId).not.toBe(profile2.providerId);
      expect(profile1.firstName).toBe('New');
      expect(profile1.lastName).toBe('User');
    });

    it('should return existing scenario with fixed email', () => {
      const profile = service.getTestUser('existing');
      expect(profile.email).toBe('existing.user@example.com');
      expect(profile.providerId).toBe('mock-existing-google-12345');
    });

    it('should return admin scenario with systemAdmin true', () => {
      const profile = service.getTestUser('admin');
      expect(profile.systemAdmin).toBe(true);
      expect(profile.email).toBe('admin.user@example.com');
    });

    it('should return regular scenario with systemAdmin false', () => {
      const profile = service.getTestUser('regular');
      expect(profile.systemAdmin).toBe(false);
      expect(profile.email).toBe('regular.user@example.com');
    });

    it('should default to new scenario when no argument given', () => {
      const profile = service.getTestUser();
      expect(profile.provider).toBe('google');
      expect(profile.firstName).toBe('New');
    });

    it('should always return provider as google', () => {
      const scenarios: Array<'new' | 'existing' | 'admin' | 'regular'> = [
        'new',
        'existing',
        'admin',
        'regular',
      ];
      scenarios.forEach((scenario) => {
        const profile = service.getTestUser(scenario);
        expect(profile.provider).toBe('google');
      });
    });
  });
});
