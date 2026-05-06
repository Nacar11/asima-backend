import { Injectable, Logger } from '@nestjs/common';
import { FirebaseService } from '@/firebase/firebase.service';
import { FcmTokenService } from './fcm-token.service';

/**
 * Push Notification Service.
 *
 * Handles sending push notifications via Firebase Cloud Messaging (FCM).
 * Integrates with FcmTokenService to get user device tokens and
 * FirebaseService to send the actual push notifications.
 *
 * @version 2
 * @since 1.0.0
 */
@Injectable()
export class PushNotificationService {
  private readonly logger = new Logger(PushNotificationService.name);

  constructor(
    private readonly firebaseService: FirebaseService,
    private readonly fcmTokenService: FcmTokenService,
  ) {}

  /**
   * Send push notification to a specific device.
   *
   * @param deviceToken - FCM device token
   * @param title - Notification title
   * @param body - Notification body
   * @param data - Optional custom data payload
   * @returns Message ID if successful, null otherwise
   */
  async sendToDevice(
    deviceToken: string,
    title: string,
    body: string,
    data?: Record<string, string>,
  ): Promise<string | null> {
    this.logger.debug(
      `Sending push to device: ${deviceToken.substring(0, 20)}...`,
    );

    const result = await this.firebaseService.sendPushNotification(
      deviceToken,
      title,
      body,
      data,
    );

    if (result) {
      this.logger.log(`Push sent successfully to device`);
    }

    return result;
  }

  /**
   * Send push notification to a user (all their registered devices).
   *
   * @param userId - User ID
   * @param title - Notification title
   * @param body - Notification body
   * @param data - Optional custom data payload
   * @returns Number of successful deliveries
   */
  async sendToUser(
    userId: number,
    title: string,
    body: string,
    data?: Record<string, string>,
  ): Promise<number> {
    // Get all active device tokens for the user
    const tokens = await this.fcmTokenService.getActiveTokensByUserId(userId);

    if (tokens.length === 0) {
      this.logger.debug(`No device tokens registered for user ${userId}`);
      return 0;
    }

    this.logger.debug(
      `Sending push to user ${userId} (${tokens.length} devices)`,
    );

    // Send to all devices
    const response = await this.firebaseService.sendToMultipleDevices(
      tokens,
      title,
      body,
      data,
    );

    if (!response) {
      return 0;
    }

    // Deactivate failed tokens
    const failedTokens: string[] = [];
    response.responses.forEach((resp, idx) => {
      if (!resp.success) {
        const errorCode = resp.error?.code;
        // These error codes indicate the token is no longer valid
        if (
          errorCode === 'messaging/invalid-registration-token' ||
          errorCode === 'messaging/registration-token-not-registered'
        ) {
          failedTokens.push(tokens[idx]);
        }
      }
    });

    // Clean up invalid tokens
    if (failedTokens.length > 0) {
      this.logger.debug(
        `Deactivating ${failedTokens.length} invalid tokens for user ${userId}`,
      );
      for (const token of failedTokens) {
        await this.fcmTokenService.deactivateToken(token);
      }
    }

    this.logger.log(
      `Push sent to user ${userId}: ${response.successCount}/${tokens.length} succeeded`,
    );

    return response.successCount;
  }

  /**
   * Send push notification to multiple users.
   *
   * @param userIds - Array of user IDs
   * @param title - Notification title
   * @param body - Notification body
   * @param data - Optional custom data payload
   * @returns Total number of successful deliveries
   */
  async sendToUsers(
    userIds: number[],
    title: string,
    body: string,
    data?: Record<string, string>,
  ): Promise<number> {
    let totalSuccess = 0;

    for (const userId of userIds) {
      const success = await this.sendToUser(userId, title, body, data);
      totalSuccess += success;
    }

    return totalSuccess;
  }

  /**
   * Broadcast push notification to all users with registered tokens.
   *
   * Note: Not implemented yet - use sendToUsers with specific user IDs.
   */
  broadcast(): void {
    this.logger.warn(
      'Broadcast push notifications not implemented - use sendToUsers with specific user IDs',
    );
  }
}
