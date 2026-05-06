import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PasswordHistoryEntity } from '../entities/password-history.entity';
import { PasswordHistory } from '@/password-history/domain/password-history';
import { PasswordHistoryMapper } from '../mappers/password-history.mapper';

@Injectable()
export class PasswordHistoryRepository {
  constructor(
    @InjectRepository(PasswordHistoryEntity)
    private readonly repository: Repository<PasswordHistoryEntity>,
  ) {}

  async create(data: Partial<PasswordHistory>): Promise<PasswordHistory> {
    const entity = this.repository.create(data as any);
    const savedEntity = (await this.repository.save(
      entity,
    )) as unknown as PasswordHistoryEntity;
    return PasswordHistoryMapper.toDomain(savedEntity);
  }

  async findByUserId(
    userId: number,
    limit?: number,
  ): Promise<PasswordHistory[]> {
    const entities = await this.repository.find({
      where: { user_id: userId },
      order: { created_at: 'DESC' },
      take: limit,
    });
    return entities.map((entity) => PasswordHistoryMapper.toDomain(entity));
  }

  async findRecentByUserId(
    userId: number,
    count: number = 5,
  ): Promise<PasswordHistory[]> {
    return this.findByUserId(userId, count);
  }

  async delete(id: number): Promise<void> {
    await this.repository.delete(id);
  }

  async deleteOldPasswordsForUser(
    userId: number,
    keepCount: number = 10,
  ): Promise<void> {
    const allPasswords = await this.repository.find({
      where: { user_id: userId },
      order: { created_at: 'DESC' },
    });

    if (allPasswords.length > keepCount) {
      const passwordsToDelete = allPasswords.slice(keepCount);
      const idsToDelete = passwordsToDelete.map((p) => p.id);
      await this.repository.delete(idsToDelete);
    }
  }
}
