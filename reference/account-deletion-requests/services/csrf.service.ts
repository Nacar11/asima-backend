import { Injectable } from '@nestjs/common';
import { randomBytes, createHash } from 'crypto';

interface CsrfToken {
  token: string;
  expiresAt: Date;
}

@Injectable()
export class CsrfService {
  private readonly tokens = new Map<string, CsrfToken>();
  private readonly TOKEN_EXPIRY_MS = 60 * 60 * 1000; // 1 hour

  generateToken(sessionId: string): string {
    // Clean up expired tokens periodically
    this.cleanupExpiredTokens();

    // Generate a cryptographically secure random token
    const token = randomBytes(32).toString('hex');
    const hashedToken = this.hashToken(token);

    // Store the hashed token with expiration
    this.tokens.set(sessionId, {
      token: hashedToken,
      expiresAt: new Date(Date.now() + this.TOKEN_EXPIRY_MS),
    });

    return token;
  }

  validateToken(sessionId: string, token: string): boolean {
    const storedToken = this.tokens.get(sessionId);

    if (!storedToken) {
      return false;
    }

    // Check if token is expired
    if (new Date() > storedToken.expiresAt) {
      this.tokens.delete(sessionId);
      return false;
    }

    // Compare hashed tokens
    const hashedToken = this.hashToken(token);
    const isValid = hashedToken === storedToken.token;

    // Invalidate token after use (single-use token)
    if (isValid) {
      this.tokens.delete(sessionId);
    }

    return isValid;
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private cleanupExpiredTokens(): void {
    const now = new Date();
    for (const [sessionId, tokenData] of this.tokens.entries()) {
      if (now > tokenData.expiresAt) {
        this.tokens.delete(sessionId);
      }
    }
  }
}
