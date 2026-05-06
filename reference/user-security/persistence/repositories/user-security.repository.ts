import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserSecurityEntity } from '../entities/user-security.entity';
import { UserSecurity } from '@/user-security/domain/user-security';
import { UserSecurityMapper } from '../mappers/user-security.mapper';
import { NullableType } from '@/utils/types/nullable.type';

@Injectable()
export class UserSecurityRepository {
  constructor(
    @InjectRepository(UserSecurityEntity)
    private readonly repository: Repository<UserSecurityEntity>,
  ) {}

  async create(
    data: Partial<Omit<UserSecurity, 'created_by' | 'updated_by'>>,
  ): Promise<UserSecurity> {
    const entity = this.repository.create(data as any);
    const savedEntity = (await this.repository.save(
      entity,
    )) as unknown as UserSecurityEntity;
    return UserSecurityMapper.toDomain(savedEntity);
  }

  async findByUserId(userId: number): Promise<NullableType<UserSecurity>> {
    const entity = await this.repository.findOne({
      where: { user_id: userId },
    });
    return entity ? UserSecurityMapper.toDomain(entity) : null;
  }

  async findById(id: number): Promise<NullableType<UserSecurity>> {
    const entity = await this.repository.findOne({
      where: { id },
    });
    return entity ? UserSecurityMapper.toDomain(entity) : null;
  }

  async update(
    id: number,
    data: Partial<Omit<UserSecurity, 'created_by' | 'updated_by'>>,
  ): Promise<UserSecurity> {
    await this.repository.update(id, data as any);
    const entity = await this.repository.findOne({ where: { id } });
    if (!entity) {
      throw new Error('User security not found');
    }
    return UserSecurityMapper.toDomain(entity);
  }

  async delete(id: number): Promise<void> {
    await this.repository.delete(id);
  }
}
