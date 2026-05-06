import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserDeviceTokenEntity } from '../persistence/entities/user-device-token.entity';
import { RegisterFcmTokenDto } from '../dto/register-fcm-token.dto';

/**
 * FCM Token Service.
 *
 * Handles registration and management of FCM device tokens for push notifications.
 *
 * @version 1
 * @since 1.0.0
 */
@Injectable()
export class FcmTokenService {
  constructor(
    @InjectRepository(UserDeviceTokenEntity)
    private readonly repository: Repository<UserDeviceTokenEntity>,
  ) {}

  /**
   * Register or update an FCM device token.
   *
   * Uses upsert to avoid race conditions when multiple requests
   * try to register the same token simultaneously.
   *
   * @param userId - User ID
   * @param dto - Register FCM token DTO
   * @returns Registered token entity
   */
  async registerToken(
    userId: number,
    dto: RegisterFcmTokenDto,
  ): Promise<UserDeviceTokenEntity> {
    const tokenData = {
      user_id: userId,
      device_token: dto.device_token,
      device_type: dto.device_type || 'mobile',
      device_name: dto.device_name,
      is_active: true,
      last_used_at: new Date(),
    };

    // Use upsert to handle race conditions - if token exists, update it
    await this.repository.upsert(tokenData, {
      conflictPaths: ['device_token'],
      skipUpdateIfNoValuesChanged: true,
    });

    // Return the upserted entity
    const token = await this.repository.findOne({
      where: { device_token: dto.device_token },
    });

    return token as UserDeviceTokenEntity;
  }

  /**
   * Get all active device tokens for a user.
   *
   * @param userId - User ID
   * @returns Array of active device tokens
   */
  async getActiveTokensByUserId(userId: number): Promise<string[]> {
    const tokens = await this.repository.find({
      where: { user_id: userId, is_active: true },
    });
    return tokens.map((t) => t.device_token);
  }

  /**
   * Deactivate a device token.
   *
   * @param deviceToken - Device token to deactivate
   */
  async deactivateToken(deviceToken: string): Promise<void> {
    await this.repository.update(
      { device_token: deviceToken },
      { is_active: false },
    );
  }

  /**
   * Deactivate all tokens for a user (e.g., on logout).
   *
   * @param userId - User ID
   */
  async deactivateAllUserTokens(userId: number): Promise<void> {
    await this.repository.update({ user_id: userId }, { is_active: false });
  }

  /**
   * Get user's device tokens.
   *
   * @param userId - User ID
   * @returns Array of device token entities
   */
  async getUserDevices(userId: number): Promise<UserDeviceTokenEntity[]> {
    return this.repository.find({
      where: { user_id: userId },
      order: { last_used_at: 'DESC' },
    });
  }
}
