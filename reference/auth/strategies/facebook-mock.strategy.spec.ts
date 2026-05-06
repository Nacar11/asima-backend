import { Test, TestingModule } from '@nestjs/testing';
import { FacebookMockService } from './facebook-mock.strategy';
import { FacebookProfile } from './facebook.strategy';

describe('FacebookMockService', () => {
  let service: FacebookMockService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FacebookMockService],
    }).compile();

    service = module.get<FacebookMockService>(FacebookMockService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateMockProfile', () => {
    it('should generate profile with default values when no params provided', () => {
      const profile = service.generateMockProfile({});

      expect(profile.provider).toBe('facebook');
      expect(profile.email).toBe('test.user@example.com');
      expect(profile.firstName).toBe('Test');
      expect(profile.lastName).toBe('User');
      expect(profile.providerId).toBe('mock-facebook-id-12345');
      expect(profile.picture).toBe('https://via.placeholder.com/150');
      expect(profile.accessToken).toBeDefined();
      expect(profile.refreshToken).toBeDefined();
    });

    it('should use custom email from query params', () => {
      const customEmail = 'custom@example.com';
      const profile = service.generateMockProfile({ email: customEmail });

      expect(profile.email).toBe(customEmail);
    });

    it('should use custom firstName from query params', () => {
      const customFirstName = 'John';
      const profile = service.generateMockProfile({
        firstName: customFirstName,
      });

      expect(profile.firstName).toBe(customFirstName);
    });

    it('should use custom lastName from query params', () => {
      const customLastName = 'Doe';
      const profile = service.generateMockProfile({ lastName: customLastName });

      expect(profile.lastName).toBe(customLastName);
    });

    it('should use custom providerId from query params', () => {
      const customProviderId = 'custom-fb-id-999';
      const profile = service.generateMockProfile({
        providerId: customProviderId,
      });

      expect(profile.providerId).toBe(customProviderId);
    });

    it('should use custom picture URL from query params', () => {
      const customPicture = 'https://example.com/avatar.jpg';
      const profile = service.generateMockProfile({ picture: customPicture });

      expect(profile.picture).toBe(customPicture);
    });

    it('should generate unique access tokens', async () => {
      const profile1 = service.generateMockProfile({});
      // Wait a bit to ensure different timestamp
      await new Promise((resolve) => setTimeout(resolve, 10));
      const profile2 = service.generateMockProfile({});

      expect(profile1.accessToken).not.toBe(profile2.accessToken);
    });

    it('should generate unique refresh tokens', async () => {
      const profile1 = service.generateMockProfile({});
      // Wait a bit to ensure different timestamp
      await new Promise((resolve) => setTimeout(resolve, 10));
      const profile2 = service.generateMockProfile({});

      expect(profile1.refreshToken).not.toBe(profile2.refreshToken);
    });

    it('should include timestamp in access token', () => {
      const profile = service.generateMockProfile({});

      expect(profile.accessToken).toContain('mock_access_token_');
    });

    it('should include timestamp in refresh token', () => {
      const profile = service.generateMockProfile({});

      expect(profile.refreshToken).toContain('mock_refresh_token_');
    });

    it('should handle all custom params together', () => {
      const params = {
        email: 'all@example.com',
        firstName: 'All',
        lastName: 'Params',
        providerId: 'all-params-id',
        picture: 'https://example.com/all.jpg',
      };

      const profile = service.generateMockProfile(params);

      expect(profile.email).toBe(params.email);
      expect(profile.firstName).toBe(params.firstName);
      expect(profile.lastName).toBe(params.lastName);
      expect(profile.providerId).toBe(params.providerId);
      expect(profile.picture).toBe(params.picture);
    });
  });

  describe('getTestUser', () => {
    it('should return new user scenario', () => {
      const profile = service.getTestUser('new');

      expect(profile.provider).toBe('facebook');
      expect(profile.email).toContain('@example.com');
      expect(profile.firstName).toBe('New');
      expect(profile.lastName).toBe('User');
      expect(profile.providerId).toContain('mock-new-user-');
    });

    it('should return existing user scenario', () => {
      const profile = service.getTestUser('existing');

      expect(profile.provider).toBe('facebook');
      expect(profile.email).toBe('existing.user@example.com');
      expect(profile.firstName).toBe('Existing');
      expect(profile.lastName).toBe('User');
      expect(profile.providerId).toBe('mock-existing-user-12345');
    });

    it('should return admin user scenario', () => {
      const profile = service.getTestUser('admin');

      expect(profile.provider).toBe('facebook');
      expect(profile.email).toBe('admin.user@example.com');
      expect(profile.firstName).toBe('Admin');
      expect(profile.lastName).toBe('User');
      expect(profile.providerId).toBe('mock-admin-user-99999');
    });

    it('should return default user when no scenario provided', () => {
      const profile = service.getTestUser();

      // Default scenario is 'new', which generates unique emails
      expect(profile.email).toContain('@example.com');
      expect(profile.firstName).toBe('New');
      expect(profile.lastName).toBe('User');
    });

    it('should generate unique emails for new user scenario', async () => {
      const profile1 = service.getTestUser('new');
      // Wait a bit to ensure different timestamp
      await new Promise((resolve) => setTimeout(resolve, 10));
      const profile2 = service.getTestUser('new');

      expect(profile1.email).not.toBe(profile2.email);
    });

    it('should generate consistent email for existing user scenario', () => {
      const profile1 = service.getTestUser('existing');
      const profile2 = service.getTestUser('existing');

      expect(profile1.email).toBe(profile2.email);
      expect(profile1.providerId).toBe(profile2.providerId);
    });

    it('should generate consistent email for admin user scenario', () => {
      const profile1 = service.getTestUser('admin');
      const profile2 = service.getTestUser('admin');

      expect(profile1.email).toBe(profile2.email);
      expect(profile1.providerId).toBe(profile2.providerId);
    });

    it('should include all required FacebookProfile fields', () => {
      const profile = service.getTestUser('new');

      expect(profile).toHaveProperty('provider');
      expect(profile).toHaveProperty('providerId');
      expect(profile).toHaveProperty('email');
      expect(profile).toHaveProperty('firstName');
      expect(profile).toHaveProperty('lastName');
      expect(profile).toHaveProperty('picture');
      expect(profile).toHaveProperty('accessToken');
      expect(profile).toHaveProperty('refreshToken');
    });

    it('should set provider to facebook for all scenarios', () => {
      const newProfile = service.getTestUser('new');
      const existingProfile = service.getTestUser('existing');
      const adminProfile = service.getTestUser('admin');

      expect(newProfile.provider).toBe('facebook');
      expect(existingProfile.provider).toBe('facebook');
      expect(adminProfile.provider).toBe('facebook');
    });

    it('should generate valid access tokens for all scenarios', () => {
      const newProfile = service.getTestUser('new');
      const existingProfile = service.getTestUser('existing');
      const adminProfile = service.getTestUser('admin');

      expect(newProfile.accessToken).toContain('mock_access_token_');
      expect(existingProfile.accessToken).toContain('mock_access_token_');
      expect(adminProfile.accessToken).toContain('mock_access_token_');
    });

    it('should generate valid refresh tokens for all scenarios', () => {
      const newProfile = service.getTestUser('new');
      const existingProfile = service.getTestUser('existing');
      const adminProfile = service.getTestUser('admin');

      expect(newProfile.refreshToken).toContain('mock_refresh_token_');
      expect(existingProfile.refreshToken).toContain('mock_refresh_token_');
      expect(adminProfile.refreshToken).toContain('mock_refresh_token_');
    });

    it('should use default picture for all scenarios', () => {
      const newProfile = service.getTestUser('new');
      const existingProfile = service.getTestUser('existing');
      const adminProfile = service.getTestUser('admin');

      expect(newProfile.picture).toBe('https://via.placeholder.com/150');
      expect(existingProfile.picture).toBe('https://via.placeholder.com/150');
      expect(adminProfile.picture).toBe('https://via.placeholder.com/150');
    });
  });

  describe('Profile validation', () => {
    it('should return valid FacebookProfile type', () => {
      const profile = service.generateMockProfile({});

      // Type check - should have all required properties
      const validateProfile = (p: FacebookProfile) => {
        expect(p.provider).toBeDefined();
        expect(p.providerId).toBeDefined();
        expect(p.email).toBeDefined();
        expect(p.firstName).toBeDefined();
        expect(p.lastName).toBeDefined();
        expect(p.picture).toBeDefined();
        expect(p.accessToken).toBeDefined();
      };

      validateProfile(profile);
    });

    it('should return valid FacebookProfile type for all scenarios', () => {
      const scenarios: Array<'new' | 'existing' | 'admin'> = [
        'new',
        'existing',
        'admin',
      ];

      scenarios.forEach((scenario) => {
        const profile = service.getTestUser(scenario);

        expect(profile.provider).toBe('facebook');
        expect(typeof profile.providerId).toBe('string');
        expect(typeof profile.email).toBe('string');
        expect(typeof profile.firstName).toBe('string');
        expect(typeof profile.lastName).toBe('string');
        expect(typeof profile.picture).toBe('string');
        expect(typeof profile.accessToken).toBe('string');
        expect(typeof profile.refreshToken).toBe('string');
      });
    });
  });
});
