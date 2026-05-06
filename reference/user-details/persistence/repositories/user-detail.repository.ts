import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserDetailEntity } from '../entities/user-detail.entity';
import { UserDetail } from '@/user-details/domain/user-detail';
import { UserDetailMapper } from '../mappers/user-detail.mapper';
import { BaseUserDetailRepository } from '../base-user-detail.repository';

@Injectable()
export class UserDetailRepository extends BaseUserDetailRepository {
  constructor(
    @InjectRepository(UserDetailEntity)
    private readonly repository: Repository<UserDetailEntity>,
  ) {
    super();
  }

  async findById(id: number): Promise<UserDetail | null> {
    const entity = await this.repository.findOne({
      where: { id },
      relations: ['created_by', 'updated_by'],
    });
    return entity ? UserDetailMapper.toDomain(entity) : null;
  }

  async findByUserId(userId: number): Promise<UserDetail | null> {
    const entity = await this.repository.findOne({
      where: { user_id: userId },
      relations: ['created_by', 'updated_by'],
    });
    return entity ? UserDetailMapper.toDomain(entity) : null;
  }

  async findByUsername(username: string): Promise<UserDetail | null> {
    const entity = await this.repository.findOne({
      where: { username },
      relations: ['created_by', 'updated_by'],
    });
    return entity ? UserDetailMapper.toDomain(entity) : null;
  }

  async create(data: Partial<UserDetail>): Promise<UserDetail> {
    const entity = this.repository.create(
      UserDetailMapper.toPersistence(data as UserDetail),
    );
    const savedEntity = await this.repository.save(entity);
    return UserDetailMapper.toDomain(savedEntity);
  }

  async update(id: number, data: Partial<UserDetail>): Promise<UserDetail> {
    await this.repository.update(id, data as any);
    const entity = await this.repository.findOne({
      where: { id },
      relations: ['created_by', 'updated_by'],
    });
    if (!entity) {
      throw new Error('User detail not found');
    }
    return UserDetailMapper.toDomain(entity);
  }
}
