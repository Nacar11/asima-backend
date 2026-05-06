import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { AllConfigType } from '@/config/config.type';

/**
 * Service for AES-256-GCM encryption/decryption
 */
@Injectable()
export class EncryptionService {
  private readonly logger = new Logger(EncryptionService.name);
  private readonly algorithm = 'aes-256-gcm';
  private readonly keyLength = 32;
  private readonly ivLength = 16;
  private readonly authTagLength = 16;
  private readonly saltLength = 16;
  private readonly encryptionKey: Buffer;
  private readonly salt: Buffer;

  constructor(private readonly configService: ConfigService<AllConfigType>) {
    const nodeEnv = this.configService.get('app.nodeEnv', { infer: true });
    const key = this.configService.get<string>('ENCRYPTION_KEY', {
      infer: true,
    });
    const saltHex = this.configService.get<string>('ENCRYPTION_SALT', {
      infer: true,
    });
    if (!key) {
      throw new Error(
        'ENCRYPTION_KEY is required. Set it in .env (min 32 characters recommended).',
      );
    }
    if (key.length < 32) {
      throw new Error(
        'ENCRYPTION_KEY must be at least 32 characters for adequate security.',
      );
    }
    if (!saltHex || saltHex.length < 32) {
      if (nodeEnv !== 'development' && nodeEnv !== 'test') {
        throw new Error(
          'ENCRYPTION_SALT is required in non-dev environments (32-char hex string).',
        );
      }
      this.salt = crypto.randomBytes(this.saltLength);
      this.logger.warn(
        '⚠️ ENCRYPTION_SALT not set. Generated random salt for this session. ' +
          'Set ENCRYPTION_SALT in .env for consistent decryption across restarts.',
      );
    } else {
      if (!this.isValidHexSalt(saltHex)) {
        throw new Error(
          'ENCRYPTION_SALT must be a 32-character hex string (generate with: openssl rand -hex 16).',
        );
      }
      this.salt = Buffer.from(saltHex, 'hex');
    }
    this.encryptionKey = this.deriveKey(key, this.salt);
  }

  private deriveKey(secret: string, salt: Buffer): Buffer {
    return crypto.scryptSync(secret, salt, this.keyLength, {
      N: 16384,
      r: 8,
      p: 1,
    });
  }

  private isValidHexSalt(saltHex: string): boolean {
    return /^[0-9a-f]{32}$/i.test(saltHex);
  }

  private isValidBase64(input: string): boolean {
    if (!input) {
      return false;
    }
    const normalized = input.replace(/\s/g, '');
    if (normalized.length % 4 !== 0) {
      return false;
    }
    if (!/^[A-Za-z0-9+/]+={0,2}$/.test(normalized)) {
      return false;
    }
    return true;
  }

  encrypt(plaintext: string): string {
    const iv = crypto.randomBytes(this.ivLength);
    const cipher = crypto.createCipheriv(
      this.algorithm,
      this.encryptionKey,
      iv,
    );
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag();
    const combined = Buffer.concat([
      iv,
      authTag,
      Buffer.from(encrypted, 'hex'),
    ]);
    return combined.toString('base64');
  }

  decrypt(encryptedData: string): string {
    try {
      if (!this.isValidBase64(encryptedData)) {
        throw new Error('Invalid encrypted data: not base64');
      }
      const combined = Buffer.from(encryptedData, 'base64');
      const minLength = this.ivLength + this.authTagLength + 1;
      if (combined.length < minLength) {
        throw new Error('Invalid encrypted data: too short');
      }
      const iv = combined.subarray(0, this.ivLength);
      const authTag = combined.subarray(
        this.ivLength,
        this.ivLength + this.authTagLength,
      );
      const encrypted = combined.subarray(this.ivLength + this.authTagLength);
      const decipher = crypto.createDecipheriv(
        this.algorithm,
        this.encryptionKey,
        iv,
      );
      decipher.setAuthTag(authTag);
      const decrypted = Buffer.concat([
        decipher.update(encrypted),
        decipher.final(),
      ]);
      return decrypted.toString('utf8');
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error('Decryption failed', message);
      throw new InternalServerErrorException(
        'Decryption failed. Data may be corrupted or key mismatch.',
      );
    }
  }
}
