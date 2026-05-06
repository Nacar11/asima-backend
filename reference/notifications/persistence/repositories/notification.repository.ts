import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { BaseNotificationRepository } from '../base-notification.repository';
import { NotificationEntity } from '../entities/notification.entity';
import { Notification } from '@/notifications/domain/notification';
import { NotificationMapper } from '../mappers/notification.mapper';
import { BaseGetDto as GetQueryParams } from '@/devextreme/dto/base-get.dto';
import { DevExtremePaginatedResponseDto } from '@/devextreme/dto/paginated-response';
import { IPaginationOptions } from '@/utils/types/pagination-options';
import { IPaginatedResult } from '@/utils/types/paginated-result';

@Injectable()
export class NotificationRepository extends BaseNotificationRepository {
  constructor(
    @InjectRepository(NotificationEntity)
    private readonly repository: Repository<NotificationEntity>,
  ) {
    super();
  }

  async create(notification: Notification): Promise<Notification> {
    const persistenceEntity = NotificationMapper.toPersistence(notification);
    const savedEntity = await this.repository.save(persistenceEntity);
    return this.findById(savedEntity.id) as Promise<Notification>;
  }

  async findByMany(
    loadOptions: GetQueryParams,
  ): Promise<DevExtremePaginatedResponseDto<Notification>> {
    const { skip = 0, take = 20 } = loadOptions;

    const [entities, totalCount] = await this.repository.findAndCount({
      relations: ['user'],
      order: { created_at: 'DESC' },
      skip,
      take,
    });

    return {
      data: entities.map((entity) => NotificationMapper.toDomain(entity)),
      totalCount,
    };
  }

  async findAllWithPagination(options: {
    filterQuery?: any;
    paginationOptions: IPaginationOptions;
  }): Promise<IPaginatedResult<Notification>> {
    const { paginationOptions } = options;
    const { page = 1, limit = 20 } = paginationOptions;
    const skip = (page - 1) * limit;

    const queryBuilder = this.repository.createQueryBuilder('notification');
    queryBuilder.leftJoinAndSelect('notification.user', 'user');

    if (options.filterQuery?.user_id !== undefined) {
      queryBuilder.where('notification.user_id = :userId', {
        userId: options.filterQuery.user_id,
      });
    }

    if (options.filterQuery?.type) {
      queryBuilder.andWhere('notification.type = :type', {
        type: options.filterQuery.type,
      });
    }

    if (options.filterQuery?.is_read !== undefined) {
      if (options.filterQuery.is_read) {
        queryBuilder.andWhere('notification.read_at IS NOT NULL');
      } else {
        queryBuilder.andWhere('notification.read_at IS NULL');
      }
    }

    queryBuilder
      .orderBy('notification.created_at', 'DESC')
      .skip(skip)
      .take(limit);

    const [entities, total] = await queryBuilder.getManyAndCount();

    return {
      data: entities.map((entity) => NotificationMapper.toDomain(entity)),
      totalResults: total,
    };
  }

  async findById(id: number): Promise<Notification | null> {
    const entity = await this.repository.findOne({
      where: { id },
      relations: ['user'],
    });

    return entity ? NotificationMapper.toDomain(entity) : null;
  }

  async findByUserId(
    userId: number,
    isRead?: boolean,
  ): Promise<Notification[]> {
    const queryBuilder = this.repository.createQueryBuilder('notification');
    queryBuilder
      .leftJoinAndSelect('notification.user', 'user')
      .where('notification.user_id = :userId', { userId });

    if (isRead !== undefined) {
      if (isRead) {
        queryBuilder.andWhere('notification.read_at IS NOT NULL');
      } else {
        queryBuilder.andWhere('notification.read_at IS NULL');
      }
    }

    queryBuilder.orderBy('notification.created_at', 'DESC');

    const entities = await queryBuilder.getMany();

    return entities.map((entity) => NotificationMapper.toDomain(entity));
  }

  async getUnreadCount(userId: number): Promise<number> {
    const count = await this.repository.count({
      where: {
        user_id: userId,
        read_at: IsNull(),
      },
    });

    return count;
  }

  async markAsRead(id: number, userId: number): Promise<void> {
    await this.repository.update(
      { id, user_id: userId },
      { read_at: new Date() },
    );
  }

  async markAllAsRead(userId: number): Promise<void> {
    await this.repository
      .createQueryBuilder()
      .update(NotificationEntity)
      .set({ read_at: new Date() })
      .where('user_id = :userId', { userId })
      .andWhere('read_at IS NULL')
      .execute();
  }

  async update(
    id: number,
    payload: Partial<Notification>,
  ): Promise<Notification> {
    const existingEntity = await this.repository.findOne({ where: { id } });

    if (!existingEntity) {
      throw new NotFoundException(`Notification with ID ${id} not found`);
    }

    const updateData = NotificationMapper.toPersistence({
      ...NotificationMapper.toDomain(existingEntity),
      ...payload,
    });

    Object.assign(existingEntity, updateData);
    await this.repository.save(existingEntity);

    return this.findById(id) as Promise<Notification>;
  }

  async delete(id: number): Promise<void> {
    await this.repository.delete(id);
  }
}
