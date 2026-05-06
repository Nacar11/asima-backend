import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SocialAccountEntity } from '../entities/social-account.entity';
import { SocialAccount } from '@/social-accounts/domain/social-account';
import { SocialAccountMapper } from '../mappers/social-account.mapper';

@Injectable()
export class SocialAccountRepository {
  constructor(
    @InjectRepository(SocialAccountEntity)
    private readonly repository: Repository<SocialAccountEntity>,
  ) {}

  async findByProviderAndProviderId(
    provider: string,
    providerId: string,
  ): Promise<SocialAccount | null> {
    const entity = await this.repository.findOne({
      where: {
        provider,
        provider_id: providerId,
      },
    });

    return entity ? SocialAccountMapper.toDomain(entity) : null;
  }

  async findByUserId(userId: number): Promise<SocialAccount[]> {
    const entities = await this.repository.find({
      where: {
        user_id: userId,
      },
    });

    return entities.map((entity) => SocialAccountMapper.toDomain(entity));
  }

  async create(
    data: Partial<Omit<SocialAccount, 'created_by' | 'updated_by'>>,
  ): Promise<SocialAccount> {
    const entity = this.repository.create(data as any);
    const savedEntity = (await this.repository.save(
      entity,
    )) as unknown as SocialAccountEntity;
    return SocialAccountMapper.toDomain(savedEntity);
  }

  async update(
    id: number,
    data: Partial<Omit<SocialAccount, 'created_by' | 'updated_by'>>,
  ): Promise<SocialAccount> {
    await this.repository.update(id, data as any);
    const entity = await this.repository.findOne({ where: { id } });
    if (!entity) {
      throw new Error('Social account not found');
    }
    return SocialAccountMapper.toDomain(entity);
  }

  async delete(id: number): Promise<void> {
    await this.repository.delete(id);
  }
}
