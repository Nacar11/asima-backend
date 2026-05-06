import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AllConfigType } from '@/config/config.type';
import * as path from 'path';
import * as fs from 'fs';
import { GoogleAuth } from 'google-auth-library';
import axios from 'axios';

/**
 * Firebase Service.
 *
 * Handles Firebase Admin SDK initialization and push notification sending
 * via Firebase Cloud Messaging (FCM).
 *
 * @version 1
 * @since 1.0.0
 */
@Injectable()
export class FirebaseService implements OnModuleInit {
  private readonly logger = new Logger(FirebaseService.name);
  private isInitialized = false;
  private googleAuth: GoogleAuth | null = null;
  private projectId: string | null = null;
  private fcmEndpoint: string | null = null;

  constructor(private readonly configService: ConfigService<AllConfigType>) {}

  onModuleInit() {
    this.initializeFirebase();
  }

  /**
   * Initialize Firebase using FCM HTTP v1 API.
   *
   * Supports two methods for credentials:
   * 1. JSON file: config/firebase-service-account.json (preferred)
   * 2. Environment variables:
   *    - FIREBASE_PROJECT_ID (required if not in service account file)
   *    - FIREBASE_PRIVATE_KEY
   *    - FIREBASE_CLIENT_EMAIL
   */
  private initializeFirebase(): void {
    if (this.isInitialized) {
      this.logger.log('Firebase already initialized');
      return;
    }

    // Try to load from JSON file first
    const serviceAccountPath = path.join(
      process.cwd(),
      'config',
      'firebase-service-account.json',
    );

    let serviceAccount: any = null;
    if (fs.existsSync(serviceAccountPath)) {
      serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
    } else {
      serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
        ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
        : null;
    }

    // Get project ID from config/environment first (allows explicit override)
    const configProjectId = this.configService.get('firebase.projectId', {
      infer: true,
    });
    if (configProjectId) {
      this.projectId = configProjectId;
      this.fcmEndpoint = `https://fcm.googleapis.com/v1/projects/${this.projectId}/messages:send`;
      this.logger.log(
        `Using project ID from environment/config: ${this.projectId}`,
      );
    }

    if (serviceAccount) {
      try {
        // If no config project ID, use service account project ID
        if (!this.projectId && serviceAccount.project_id) {
          this.projectId = serviceAccount.project_id;
          this.fcmEndpoint = `https://fcm.googleapis.com/v1/projects/${this.projectId}/messages:send`;
          this.logger.log(
            `Using project ID from service account: ${this.projectId}`,
          );
        }

        // Warn if there's a mismatch (but still use config project ID if set)
        if (
          configProjectId &&
          serviceAccount.project_id &&
          configProjectId !== serviceAccount.project_id
        ) {
          this.logger.warn(
            `⚠️  Project ID mismatch: Config=${configProjectId}, ServiceAccount=${serviceAccount.project_id}`,
          );
          this.logger.warn(
            `Using ${configProjectId}. Ensure FCM tokens are registered with this project and service account has access.`,
          );
        }

        // Ensure project ID is set before initializing
        if (!this.projectId) {
          this.logger.error(
            'Project ID not found in service account file or environment variables',
          );
          this.logger.error(
            'Please set FIREBASE_PROJECT_ID in .env or ensure service account file contains project_id',
          );
          return;
        }

        this.googleAuth = new GoogleAuth({
          credentials: serviceAccount,
          scopes: ['https://www.googleapis.com/auth/firebase.messaging'],
        });
        this.isInitialized = true;
        this.logger.log(
          `Firebase FCM HTTP v1 API initialized successfully (Project: ${this.projectId})`,
        );
        this.logger.log(`FCM Endpoint: ${this.fcmEndpoint}`);
        return;
      } catch (error) {
        this.logger.error(
          `Failed to initialize Firebase from JSON file: ${error.message}`,
        );
        // Fall through to try environment variables
      }
    }

    // Fall back to environment variables
    const privateKey = this.configService.get('firebase.privateKey', {
      infer: true,
    });
    const clientEmail = this.configService.get('firebase.clientEmail', {
      infer: true,
    });

    if (!privateKey || !clientEmail) {
      this.logger.warn(
        'Firebase credentials not configured - push notifications disabled',
      );
      this.logger.warn(
        'Either place config/firebase-service-account.json or set FIREBASE_PRIVATE_KEY, FIREBASE_CLIENT_EMAIL in .env',
      );
      return;
    }

    // Ensure project ID is set (required for FCM endpoint)
    if (!this.projectId) {
      this.logger.error(
        'FIREBASE_PROJECT_ID is required when using environment variables',
      );
      this.logger.error('Please set FIREBASE_PROJECT_ID in your .env file');
      return;
    }

    try {
      this.googleAuth = new GoogleAuth({
        credentials: {
          project_id: this.projectId,
          private_key: privateKey.replace(/\\n/g, '\n'),
          client_email: clientEmail,
        },
        scopes: ['https://www.googleapis.com/auth/firebase.messaging'],
      });
      this.isInitialized = true;
      this.logger.log(
        `Firebase FCM HTTP v1 API initialized successfully from environment variables (Project: ${this.projectId})`,
      );
      this.logger.log(`FCM Endpoint: ${this.fcmEndpoint}`);
    } catch (error) {
      this.logger.error(`Firebase initialization failed: ${error.message}`);
    }
  }

  /**
   * Check if Firebase is initialized and ready.
   */
  isReady(): boolean {
    return this.isInitialized && this.googleAuth !== null;
  }

  /**
   * Get OAuth2 access token for FCM API.
   */
  private async getAccessToken(): Promise<string | null> {
    if (!this.googleAuth) {
      this.logger.error('GoogleAuth not initialized');
      return null;
    }

    try {
      const client = await this.googleAuth.getClient();
      const accessToken = await client.getAccessToken();

      if (!accessToken.token) {
        this.logger.error('Access token is null or undefined');
        return null;
      }

      this.logger.debug(
        `Access token obtained: ${accessToken.token.substring(0, 20)}...`,
      );
      return accessToken.token;
    } catch (error: any) {
      this.logger.error(`Failed to get access token: ${error.message}`);
      if (error.stack) {
        this.logger.error(`Stack trace: ${error.stack}`);
      }
      return null;
    }
  }

  /**
   * Send push notification to a single device using FCM HTTP v1 API.
   *
   * @param token - FCM device token
   * @param title - Notification title
   * @param body - Notification body
   * @param data - Optional custom data payload
   * @returns Message ID if successful, null otherwise
   */
  async sendPushNotification(
    token: string,
    title: string,
    body: string,
    data?: Record<string, string>,
  ): Promise<string | null> {
    if (!this.isReady() || !this.fcmEndpoint) {
      this.logger.debug(
        'Firebase not initialized - skipping push notification',
      );
      return null;
    }

    const accessToken = await this.getAccessToken();
    if (!accessToken) {
      this.logger.error('Failed to get access token for FCM');
      return null;
    }

    try {
      // Format message according to FCM HTTP v1 API (matching Firebase Console format)
      const message: any = {
        message: {
          token: token,
          notification: {
            title: title,
            body: body,
          },
          android: {
            priority: 'high',
            notification: {
              channel_id: 'travajo_notifications',
            },
          },
        },
      };

      // Only add data field if data is provided and not empty
      if (data && Object.keys(data).length > 0) {
        message.message.data = Object.keys(data).reduce(
          (acc, key) => {
            acc[key] = String(data[key]);
            return acc;
          },
          {} as Record<string, string>,
        );
      }

      this.logger.debug(`Sending to FCM endpoint: ${this.fcmEndpoint}`);
      this.logger.debug(`Message payload: ${JSON.stringify(message, null, 2)}`);

      const response = await axios.post(this.fcmEndpoint, message, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      const messageId = response.data.name;
      this.logger.log(`✅ Push notification sent successfully: ${messageId}`);
      this.logger.debug(
        `Full response: ${JSON.stringify(response.data, null, 2)}`,
      );
      return messageId;
    } catch (error: any) {
      this.logger.error(`❌ Push notification failed: ${error.message}`);

      if (error.response) {
        const errorCode = error.response.data?.error?.status;
        const errorMessage = error.response.data?.error?.message;
        const errorDetails = error.response.data?.error;

        this.logger.error(`FCM API Error Response:`);
        this.logger.error(`  Status: ${error.response.status}`);
        this.logger.error(`  Code: ${errorCode}`);
        this.logger.error(`  Message: ${errorMessage}`);
        this.logger.error(
          `  Full Error: ${JSON.stringify(errorDetails, null, 2)}`,
        );

        // Handle invalid tokens
        if (
          errorCode === 'INVALID_ARGUMENT' ||
          errorMessage?.includes('Invalid registration token') ||
          errorMessage?.includes('registration-token-not-registered')
        ) {
          this.logger.warn(
            `Invalid token detected: ${token.substring(0, 20)}...`,
          );
        }
      } else if (error.request) {
        this.logger.error(`No response received from FCM API`);
        this.logger.error(
          `Request details: ${JSON.stringify(error.request, null, 2)}`,
        );
      } else {
        this.logger.error(`Error setting up request: ${error.message}`);
      }

      return null;
    }
  }

  /**
   * Send push notification to multiple devices using FCM HTTP v1 API.
   *
   * @param tokens - Array of FCM device tokens
   * @param title - Notification title
   * @param body - Notification body
   * @param data - Optional custom data payload
   * @returns Object with success/failure counts and failed tokens
   */
  async sendToMultipleDevices(
    tokens: string[],
    title: string,
    body: string,
    data?: Record<string, string>,
  ): Promise<{
    successCount: number;
    failureCount: number;
    responses: Array<{ success: boolean; token: string; error?: any }>;
  } | null> {
    if (!this.isReady()) {
      this.logger.debug('Firebase not initialized - skipping batch push');
      return null;
    }

    if (tokens.length === 0) {
      this.logger.debug('No tokens provided for batch push');
      return null;
    }

    const accessToken = await this.getAccessToken();
    if (!accessToken) {
      this.logger.error('Failed to get access token for FCM');
      return null;
    }

    const responses: Array<{ success: boolean; token: string; error?: any }> =
      [];
    let successCount = 0;
    let failureCount = 0;

    // Send to each device individually (FCM HTTP v1 doesn't have multicast)
    for (const token of tokens) {
      const result = await this.sendPushNotification(token, title, body, data);
      if (result) {
        successCount++;
        responses.push({ success: true, token });
      } else {
        failureCount++;
        responses.push({
          success: false,
          token,
          error: { code: 'messaging/invalid-registration-token' },
        });
      }
    }

    this.logger.debug(
      `Batch push: ${successCount}/${tokens.length} succeeded, ${failureCount} failed`,
    );

    return { successCount, failureCount, responses };
  }

  /**
   * Send silent/data-only notification using FCM HTTP v1 API.
   *
   * @param token - FCM device token
   * @param data - Custom data payload
   * @returns Message ID if successful, null otherwise
   */
  async sendDataNotification(
    token: string,
    data: Record<string, string>,
  ): Promise<string | null> {
    if (!this.isReady() || !this.fcmEndpoint) {
      return null;
    }

    const accessToken = await this.getAccessToken();
    if (!accessToken) {
      this.logger.error('Failed to get access token for FCM');
      return null;
    }

    try {
      const message = {
        message: {
          token: token,
          data: Object.keys(data).reduce(
            (acc, key) => {
              acc[key] = String(data[key]);
              return acc;
            },
            {} as Record<string, string>,
          ),
          android: {
            priority: 'high',
          },
        },
      };

      const response = await axios.post(this.fcmEndpoint, message, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      return response.data.name;
    } catch (error: any) {
      this.logger.error(`Data notification failed: ${error.message}`);
      return null;
    }
  }
}
