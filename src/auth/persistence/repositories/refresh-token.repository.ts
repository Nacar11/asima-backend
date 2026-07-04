import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, LessThanOrEqual, MoreThan, Repository } from 'typeorm';
import { BaseRefreshTokenRepository } from '@/auth/persistence/base-refresh-token.repository';
import { RefreshTokenEntity } from '@/auth/persistence/entities/refresh-token.entity';

@Injectable()
export class RefreshTokenRepository extends BaseRefreshTokenRepository {
  constructor(
    @InjectRepository(RefreshTokenEntity)
    private readonly repo: Repository<RefreshTokenEntity>,
  ) {
    super();
  }

  async issue(input: { user_id: number; jti: string; expires_at: Date }): Promise<void> {
    const entity = this.repo.create({
      user_id: input.user_id,
      jti: input.jti,
      expires_at: input.expires_at,
      revoked_at: null,
    });
    await this.repo.save(entity);
  }

  async isActive(jti: string): Promise<boolean> {
    const count = await this.repo.count({
      where: { jti, revoked_at: IsNull(), expires_at: MoreThan(new Date()) },
    });
    return count > 0;
  }

  async revokeIfActive(jti: string): Promise<boolean> {
    const result = await this.repo
      .createQueryBuilder()
      .update(RefreshTokenEntity)
      .set({ revoked_at: () => 'now()' })
      .where('jti = :jti AND revoked_at IS NULL', { jti })
      .execute();
    return (result.affected ?? 0) > 0;
  }

  async revokeAllForUser(user_id: number): Promise<void> {
    await this.repo
      .createQueryBuilder()
      .update(RefreshTokenEntity)
      .set({ revoked_at: () => 'now()' })
      .where('user_id = :user_id AND revoked_at IS NULL', { user_id })
      .execute();
  }

  async deleteExpired(asOf: Date): Promise<number> {
    const result = await this.repo.delete({ expires_at: LessThanOrEqual(asOf) });
    return result.affected ?? 0;
  }
}
