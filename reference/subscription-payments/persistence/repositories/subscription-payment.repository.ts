import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { SubscriptionPaymentEntity } from '@/subscription-payments/persistence/entities/subscription-payment.entity';
import { SubscriptionPayment } from '@/subscription-payments/domain/subscription-payment';
import { BaseSubscriptionPaymentRepository } from '@/subscription-payments/persistence/base-subscription-payment.repository';
import { SubscriptionPaymentMapper } from '@/subscription-payments/persistence/mappers/subscription-payment.mapper';
import { NullableType } from '@/utils/types/nullable.type';
import { IPaginationOptions } from '@/utils/types/pagination-options';
import { IPaginatedResult } from '@/utils/types/paginated-result';
import { QuerySubscriptionPaymentDto } from '@/subscription-payments/dto/query-subscription-payment.dto';
import { User } from '@/users/domain/user';
import { UserMapper } from '@/users/persistence/mappers/user.mapper';
import { DeepPartial } from 'typeorm';

@Injectable()
export class SubscriptionPaymentRepository
  implements BaseSubscriptionPaymentRepository
{
  constructor(
    @InjectRepository(SubscriptionPaymentEntity)
    private readonly repository: Repository<SubscriptionPaymentEntity>,
  ) {}

  async create(
    data: Partial<SubscriptionPayment>,
  ): Promise<SubscriptionPayment> {
    const persistenceModel = SubscriptionPaymentMapper.toPersistence(data);
    const newEntity = await this.repository.save(
      this.repository.create(persistenceModel),
    );
    return SubscriptionPaymentMapper.toDomain(newEntity);
  }

  async findAllWithPagination(params: {
    filterQuery?: QuerySubscriptionPaymentDto;
    paginationOptions: IPaginationOptions;
  }): Promise<IPaginatedResult<SubscriptionPayment>> {
    const { filterQuery, paginationOptions } = params;
    const { page, limit } = paginationOptions;

    const queryBuilder = this.repository
      .createQueryBuilder('payment')
      .leftJoinAndSelect('payment.subscription', 'subscription')
      .leftJoinAndSelect('subscription.plan', 'plan');

    if (filterQuery?.search) {
      queryBuilder.andWhere('(payment.payment_number ILIKE :search)', {
        search: `%${filterQuery.search}%`,
      });
    }

    if (filterQuery?.payment_status) {
      queryBuilder.andWhere('payment.payment_status = :payment_status', {
        payment_status: filterQuery.payment_status,
      });
    }

    if (filterQuery?.subscription_id) {
      queryBuilder.andWhere('payment.subscription_id = :subscription_id', {
        subscription_id: filterQuery.subscription_id,
      });
    }

    queryBuilder
      .orderBy('payment.id', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [entities, totalCount] = await queryBuilder.getManyAndCount();

    return {
      data: entities.map(SubscriptionPaymentMapper.toDomain),
      totalResults: totalCount,
    };
  }

  async findById(id: number): Promise<NullableType<SubscriptionPayment>> {
    const entity = await this.repository.findOne({
      where: { id },
      relations: ['subscription', 'subscription.plan'],
    });

    return entity ? SubscriptionPaymentMapper.toDomain(entity) : null;
  }

  async findByNumber(
    payment_number: string,
  ): Promise<NullableType<SubscriptionPayment>> {
    const entity = await this.repository.findOne({
      where: { payment_number },
      relations: ['subscription', 'subscription.plan'],
    });

    return entity ? SubscriptionPaymentMapper.toDomain(entity) : null;
  }

  async findBySubscriptionId(
    subscription_id: number,
  ): Promise<SubscriptionPayment[]> {
    const entities = await this.repository.find({
      where: { subscription_id },
      relations: ['subscription'],
      order: { id: 'DESC' },
    });

    return entities.map(SubscriptionPaymentMapper.toDomain);
  }

  async update(
    id: number,
    payload: DeepPartial<SubscriptionPayment>,
  ): Promise<SubscriptionPayment> {
    const entity = await this.repository.findOne({ where: { id } });

    if (!entity) {
      throw new NotFoundException('Subscription payment does not exist!');
    }

    const updateData = SubscriptionPaymentMapper.toPersistence({
      ...SubscriptionPaymentMapper.toDomain(entity),
      ...payload,
    } as SubscriptionPayment);

    const updatedEntity = await this.repository.save(
      this.repository.create(updateData),
    );

    return SubscriptionPaymentMapper.toDomain(updatedEntity);
  }

  async remove(id: number, causer: User): Promise<void> {
    const entity = await this.repository.findOne({ where: { id } });

    if (!entity) {
      throw new NotFoundException('Subscription payment does not exist!');
    }

    const transactionManager = this.repository.manager;
    const causerEntity = UserMapper.toPersistence(causer);

    await transactionManager.transaction(async (manager: EntityManager) => {
      await manager.update(
        SubscriptionPaymentEntity,
        { id: entity.id },
        {
          updated_by: causerEntity,
          deleted_by: causerEntity,
        },
      );
      await manager.softDelete(SubscriptionPaymentEntity, { id: entity.id });
    });
  }
}
