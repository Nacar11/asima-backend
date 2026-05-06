import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { UserAssignmentEntity } from '@/user-assignments/persistence/entities/user-assignment.entity';
import { NullableType } from '@/utils/types/nullable.type';
import { UserAssignment } from '@/user-assignments/domain/user-assignment';
import { BaseUserAssignmentRepository } from '@/user-assignments/persistence/base-user-assignment.repository';
import { UserAssignmentMapper } from '@/user-assignments/persistence/mappers/user-assignment.mapper';
import { IPaginationOptions } from '@/utils/types/pagination-options';
import { IPaginatedResult } from '@/utils/types/paginated-result';
import { StatusEnum } from '@/user-assignments/user-assignments.enum';

@Injectable()
export class UserAssignmentRepository implements BaseUserAssignmentRepository {
  constructor(
    @InjectRepository(UserAssignmentEntity)
    private readonly userAssignmentRepository: Repository<UserAssignmentEntity>,
  ) {}

  async create(data: UserAssignment): Promise<UserAssignment> {
    const persistenceModel = UserAssignmentMapper.toPersistence(data);
    const newEntity = await this.userAssignmentRepository.save(
      this.userAssignmentRepository.create(persistenceModel),
    );
    return UserAssignmentMapper.toDomain(newEntity);
  }

  async findAllWithPagination({
    paginationOptions,
  }: {
    paginationOptions: IPaginationOptions;
  }): Promise<IPaginatedResult<UserAssignment>> {
    const [entities, totalResults] =
      await this.userAssignmentRepository.findAndCount({
        skip: (paginationOptions.page - 1) * paginationOptions.limit,
        take: paginationOptions.limit,
      });

    const data = entities.map((entity) =>
      UserAssignmentMapper.toDomain(entity),
    );
    return { data, totalResults };
  }

  async findById(
    id: UserAssignment['id'],
  ): Promise<NullableType<UserAssignment>> {
    const entity = await this.userAssignmentRepository.findOne({
      where: { id },
    });

    return entity ? UserAssignmentMapper.toDomain(entity) : null;
  }

  async findByIds(ids: UserAssignment['id'][]): Promise<UserAssignment[]> {
    const entities = await this.userAssignmentRepository.find({
      where: { id: In(ids) },
    });

    return entities.map((entity) => UserAssignmentMapper.toDomain(entity));
  }

  async findAll(): Promise<Pick<UserAssignment, 'id' | 'group' | 'user'>[]> {
    const userAssignments = await this.userAssignmentRepository.find({
      where: [{ status: In([StatusEnum.ACTIVE]) }],
    });

    return userAssignments.map((userAssignment) => {
      const { id, group, user } = UserAssignmentMapper.toDomain(userAssignment);
      return { id, group, user };
    });
  }

  async update(
    id: UserAssignment['id'],
    payload: Partial<UserAssignment>,
  ): Promise<UserAssignment> {
    const entity = await this.userAssignmentRepository.findOne({
      where: { id },
    });

    if (!entity) {
      throw new NotFoundException('Record not found');
    }

    const updatedEntity = await this.userAssignmentRepository.save(
      this.userAssignmentRepository.create(
        UserAssignmentMapper.toPersistence({
          ...UserAssignmentMapper.toDomain(entity),
          ...payload,
        }),
      ),
    );

    return UserAssignmentMapper.toDomain(updatedEntity);
  }

  async remove(id: UserAssignment['id']): Promise<void> {
    const entity = await this.userAssignmentRepository.findOne({
      where: { id },
    });

    if (!entity) {
      throw new NotFoundException('Record not found');
    }

    await this.userAssignmentRepository.softDelete({ id });
  }

  async removeByIds(ids: UserAssignment['id'][]): Promise<void> {
    await this.userAssignmentRepository.softDelete({
      id: In(ids),
    });
  }

  async removeByUserAndGroup(userId: number, groupId: number): Promise<void> {
    await this.userAssignmentRepository.softDelete({
      user: { id: userId },
      group: { id: groupId },
    });
  }

  async findActiveByUserId(userId: number): Promise<UserAssignment[]> {
    const userAssignments = await this.userAssignmentRepository.find({
      where: {
        user: { id: userId },
        status: StatusEnum.ACTIVE,
      },
    });

    return userAssignments.map((entity) =>
      UserAssignmentMapper.toDomain(entity),
    );
  }
}
