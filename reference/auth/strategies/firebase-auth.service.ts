import {
  Injectable,
  UnauthorizedException,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AllConfigType } from '@/config/config.type';
import * as admin from 'firebase-admin';
import * as path from 'path';
import * as fs from 'fs';

export interface FirebaseOAuthProfile {
  provider: string;
  providerId: string;
  email: string;
  firstName: string;
  lastName: string;
  picture: string;
  accessToken: string;
}

/**
 * Verifies Firebase ID tokens from mobile clients and extracts
 * the OAuth profile (Google or Facebook) for use with validateOAuthLogin().
 *
 * Only supports google.com and facebook.com providers.
 */
@Injectable()
export class FirebaseAuthService implements OnModuleInit {
  private readonly logger = new Logger(FirebaseAuthService.name);
  private app: admin.app.App | null = null;

  constructor(private readonly configService: ConfigService<AllConfigType>) {}

  onModuleInit() {
    this.initializeApp();
  }

  private initializeApp(): void {
    // Reuse existing default app if already initialized
    try {
      this.app = admin.app();
      this.logger.log('Reusing existing Firebase Admin app');
      return;
    } catch {
      // No existing app — initialize below
    }

    const serviceAccountPath = path.join(
      process.cwd(),
      'config',
      'firebase-service-account.json',
    );

    let credential: admin.credential.Credential;

    if (fs.existsSync(serviceAccountPath)) {
      credential = admin.credential.cert(serviceAccountPath);
    } else if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      credential = admin.credential.cert(
        JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT),
      );
    } else {
      const projectId = this.configService.get('firebase.projectId', {
        infer: true,
      });
      const privateKey = this.configService.get('firebase.privateKey', {
        infer: true,
      });
      const clientEmail = this.configService.get('firebase.clientEmail', {
        infer: true,
      });

      if (!projectId || !privateKey || !clientEmail) {
        this.logger.warn(
          'Firebase credentials not configured — Firebase auth disabled',
        );
        return;
      }

      credential = admin.credential.cert({
        projectId,
        privateKey: privateKey.replace(/\\n/g, '\n'),
        clientEmail,
      });
    }

    try {
      this.app = admin.initializeApp({ credential });
      this.logger.log(
        'Firebase Admin SDK initialized for auth token verification',
      );
    } catch (error) {
      this.logger.error(`Firebase Admin init failed: ${error.message}`);
    }
  }

  /**
   * Verifies a Firebase ID token and returns an OAuth profile.
   * Only accepts google.com and facebook.com as providers.
   */
  async verifyIdToken(idToken: string): Promise<FirebaseOAuthProfile> {
    if (!this.app) {
      throw new UnauthorizedException('Firebase auth is not configured');
    }

    let decodedToken: admin.auth.DecodedIdToken;
    try {
      decodedToken = await this.app.auth().verifyIdToken(idToken);
    } catch {
      throw new UnauthorizedException('Invalid or expired Firebase ID token');
    }

    const provider = decodedToken.firebase?.sign_in_provider;

    if (provider !== 'google.com' && provider !== 'facebook.com') {
      throw new UnauthorizedException(
        `Unsupported provider: ${provider}. Only google.com and facebook.com are allowed.`,
      );
    }

    const normalizedProvider =
      provider === 'google.com' ? 'google' : 'facebook';

    const nameParts = (decodedToken.name || '').trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    return {
      provider: normalizedProvider,
      providerId: decodedToken.uid,
      email: decodedToken.email || '',
      firstName,
      lastName,
      picture: decodedToken.picture || '',
      accessToken: idToken,
    };
  }
}
