import { Injectable } from '@nestjs/common';
import { FacebookProfile } from './facebook.strategy';

/**
 * Mock Facebook OAuth Helper for Local Development
 *
 * This helper bypasses the real Facebook OAuth flow and allows you to test
 * the entire authentication flow locally without needing Facebook credentials.
 *
 * Usage:
 * - GET /auth/facebook/mock?email=test@example.com&firstName=John&lastName=Doe
 * - Or use default test user if no params provided
 */
@Injectable()
export class FacebookMockService {
  /**
   * Generate a mock Facebook profile from query parameters
   */
  generateMockProfile(queryParams: Record<string, any>): FacebookProfile {
    const {
      email = 'test.user@example.com',
      firstName = 'Test',
      lastName = 'User',
      providerId = 'mock-facebook-id-12345',
      picture = 'https://via.placeholder.com/150',
    } = queryParams;

    // Generate mock tokens
    const mockAccessToken = `mock_access_token_${Date.now()}`;
    const mockRefreshToken = `mock_refresh_token_${Date.now()}`;

    // Return mock profile that matches FacebookProfile interface

    return {
      provider: 'facebook',
      providerId,
      email,
      firstName,
      lastName,
      picture,
      accessToken: mockAccessToken,
      refreshToken: mockRefreshToken,
    };
  }

  /**
   * Get predefined test users for common scenarios
   */
  getTestUser(
    scenario: 'new' | 'existing' | 'admin' | 'regular' = 'new',
  ): FacebookProfile {
    const baseProfile = {
      provider: 'facebook',
      accessToken: `mock_access_token_${Date.now()}`,
      refreshToken: `mock_refresh_token_${Date.now()}`,
      picture: 'https://via.placeholder.com/150',
    };

    switch (scenario) {
      case 'new':
        return {
          ...baseProfile,
          providerId: 'mock-new-user-' + Date.now(),
          email: `newuser${Date.now()}@example.com`,
          firstName: 'New',
          lastName: 'User',
        };
      case 'existing':
        return {
          ...baseProfile,
          providerId: 'mock-existing-user-12345',
          email: 'existing.user@example.com',
          firstName: 'Existing',
          lastName: 'User',
        };
      case 'admin':
        return {
          ...baseProfile,
          providerId: 'mock-admin-user-99999',
          email: 'admin.user@example.com',
          firstName: 'Admin',
          lastName: 'User',
          systemAdmin: true, // System administrator
        };
      case 'regular':
        return {
          ...baseProfile,
          providerId: 'mock-regular-user-88888',
          email: 'regular.user@example.com',
          firstName: 'Regular',
          lastName: 'User',
          systemAdmin: false, // Regular user (not system admin)
        };
      default:
        return {
          ...baseProfile,
          providerId: 'mock-default-user-12345',
          email: 'test.user@example.com',
          firstName: 'Test',
          lastName: 'User',
        };
    }
  }
}
