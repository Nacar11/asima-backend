import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, MoreThan, IsNull } from 'typeorm';
import { PasswordResetTokenEntity } from '../entities/password-reset-token.entity';
import { PasswordResetToken } from '@/password-reset-tokens/domain/password-reset-token';
import { PasswordResetTokenMapper } from '../mappers/password-reset-token.mapper';
import { NullableType } from '@/utils/types/nullable.type';

@Injectable()
export class PasswordResetTokenRepository {
  constructor(
    @InjectRepository(PasswordResetTokenEntity)
    private readonly repository: Repository<PasswordResetTokenEntity>,
  ) {}

  async create(data: Partial<PasswordResetToken>): Promise<PasswordResetToken> {
    const entity = this.repository.create(data as any);
    const savedEntity = (await this.repository.save(
      entity,
    )) as unknown as PasswordResetTokenEntity;
    return PasswordResetTokenMapper.toDomain(savedEntity);
  }

  async findByToken(token: string): Promise<NullableType<PasswordResetToken>> {
    const entity = await this.repository.findOne({
      where: { token },
    });
    return entity ? PasswordResetTokenMapper.toDomain(entity) : null;
  }

  async findValidToken(
    token: string,
  ): Promise<NullableType<PasswordResetToken>> {
    const entity = await this.repository.findOne({
      where: {
        token,
        used_at: IsNull(),
        expires_at: MoreThan(new Date()),
      },
    });
    return entity ? PasswordResetTokenMapper.toDomain(entity) : null;
  }

  async findByOtp(otp: string): Promise<NullableType<PasswordResetToken>> {
    const entity = await this.repository.findOne({
      where: { otp },
    });
    return entity ? PasswordResetTokenMapper.toDomain(entity) : null;
  }

  async findValidOtp(otp: string): Promise<NullableType<PasswordResetToken>> {
    const entity = await this.repository.findOne({
      where: {
        otp,
        used_at: IsNull(),
        expires_at: MoreThan(new Date()),
      },
    });
    return entity ? PasswordResetTokenMapper.toDomain(entity) : null;
  }

  async findByUserId(userId: number): Promise<PasswordResetToken[]> {
    const entities = await this.repository.find({
      where: { user_id: userId },
      order: { created_at: 'DESC' },
    });
    return entities.map((entity) => PasswordResetTokenMapper.toDomain(entity));
  }

  async markAsUsed(id: number): Promise<PasswordResetToken> {
    await this.repository.update(id, { used_at: new Date() });
    const entity = await this.repository.findOne({ where: { id } });
    if (!entity) {
      throw new Error('Password reset token not found');
    }
    return PasswordResetTokenMapper.toDomain(entity);
  }

  /**
   * Mark token as used with a custom timestamp
   * Useful for OTP flows where we need to ensure timestamp is after hash issuance
   */
  async markAsUsedWithTimestamp(
    id: number,
    timestamp: Date,
  ): Promise<PasswordResetToken> {
    await this.repository.update(id, { used_at: timestamp });
    const entity = await this.repository.findOne({ where: { id } });
    if (!entity) {
      throw new Error('Password reset token not found');
    }
    return PasswordResetTokenMapper.toDomain(entity);
  }

  /**
   * Atomically mark token as used only if it's currently unused
   * Returns true if successfully marked, false if already used
   * This prevents race conditions in concurrent reset attempts
   */
  async markAsUsedIfUnused(id: number): Promise<boolean> {
    const result = await this.repository
      .createQueryBuilder()
      .update(PasswordResetTokenEntity)
      .set({ used_at: new Date() })
      .where('id = :id', { id })
      .andWhere('used_at IS NULL')
      .execute();

    return (result.affected ?? 0) > 0;
  }

  async deleteExpired(): Promise<void> {
    await this.repository.delete({
      expires_at: LessThan(new Date()),
    });
  }

  async delete(id: number): Promise<void> {
    await this.repository.delete(id);
  }

  async deleteByUserId(userId: number): Promise<void> {
    await this.repository.delete({ user_id: userId });
  }

  /**
   * Delete all email change tokens for a user in a single query
   * More efficient than looping through tokens one-by-one
   */
  async deleteEmailChangeTokensByUserId(userId: number): Promise<void> {
    await this.repository
      .createQueryBuilder()
      .delete()
      .from(PasswordResetTokenEntity)
      .where('user_id = :userId', { userId })
      .andWhere("metadata->>'type' = :type", { type: 'email_change' })
      .execute();
  }
}
