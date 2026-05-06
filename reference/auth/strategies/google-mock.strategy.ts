import { Injectable } from '@nestjs/common';
import { GoogleProfile } from './google.strategy';

/**
 * Mock Google OAuth Helper for Local Development
 *
 * Bypasses the real Google OAuth flow for local testing.
 *
 * Usage:
 * - GET /auth/google/mock
 * - GET /auth/google/mock?email=test@example.com&firstName=John&lastName=Doe
 * - GET /auth/google/mock?scenario=new|existing|admin|regular
 */
@Injectable()
export class GoogleMockService {
  private tokenCounter = 0;

  private nextToken(): number {
    return ++this.tokenCounter;
  }

  generateMockProfile(queryParams: Record<string, any>): GoogleProfile {
    const {
      email = 'test.user@example.com',
      firstName = 'Test',
      lastName = 'User',
      providerId = 'mock-google-id-12345',
      picture = 'https://via.placeholder.com/150',
    } = queryParams;

    return {
      provider: 'google',
      providerId,
      email,
      firstName,
      lastName,
      picture,
      accessToken: `mock_access_token_${this.nextToken()}`,
      refreshToken: `mock_refresh_token_${this.nextToken()}`,
    };
  }

  getTestUser(
    scenario: 'new' | 'existing' | 'admin' | 'regular' = 'new',
  ): GoogleProfile {
    const baseProfile = {
      provider: 'google',
      accessToken: `mock_access_token_${this.nextToken()}`,
      refreshToken: `mock_refresh_token_${this.nextToken()}`,
      picture: 'https://via.placeholder.com/150',
    };

    switch (scenario) {
      case 'new': {
        const nonce = this.nextToken();
        return {
          ...baseProfile,
          providerId: 'mock-new-google-' + nonce,
          email: `newuser${nonce}@example.com`,
          firstName: 'New',
          lastName: 'User',
        };
      }
      case 'existing':
        return {
          ...baseProfile,
          providerId: 'mock-existing-google-12345',
          email: 'existing.user@example.com',
          firstName: 'Existing',
          lastName: 'User',
        };
      case 'admin':
        return {
          ...baseProfile,
          providerId: 'mock-admin-google-99999',
          email: 'admin.user@example.com',
          firstName: 'Admin',
          lastName: 'User',
          systemAdmin: true,
        };
      case 'regular':
        return {
          ...baseProfile,
          providerId: 'mock-regular-google-88888',
          email: 'regular.user@example.com',
          firstName: 'Regular',
          lastName: 'User',
          systemAdmin: false,
        };
      default:
        return {
          ...baseProfile,
          providerId: 'mock-default-google-12345',
          email: 'test.user@example.com',
          firstName: 'Test',
          lastName: 'User',
        };
    }
  }
}
