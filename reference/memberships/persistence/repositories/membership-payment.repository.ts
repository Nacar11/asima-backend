import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { MembershipPaymentEntity } from '@/memberships/persistence/entities/membership-payment.entity';
import { BaseMembershipPaymentRepository } from '@/memberships/persistence/base-membership-payment.repository';
import { MembershipPayment } from '@/memberships/domain/membership-payment';
import { MembershipPaymentMapper } from '@/memberships/persistence/mappers/membership-payment.mapper';
import { QueryMembershipPaymentDto } from '@/memberships/dto/query-membership-payment.dto';
import { FindAllMembershipPayment } from '@/memberships/domain/find-all-membership-payment';
import { NullableType } from '@/utils/types/nullable.type';
import { PAGINATION_DEFAULTS } from '@/utils/constants/pagination.constants';
import { User } from '@/users/domain/user';
import { UserMapper } from '@/users/persistence/mappers/user.mapper';
import { DeepPartial } from 'typeorm';

@Injectable()
export class MembershipPaymentRepository
  implements BaseMembershipPaymentRepository
{
  constructor(
    @InjectRepository(MembershipPaymentEntity)
    private readonly repository: Repository<MembershipPaymentEntity>,
  ) {}
  async create(data: Partial<MembershipPayment>): Promise<MembershipPayment> {
    const persistenceModel: MembershipPaymentEntity =
      MembershipPaymentMapper.toPersistence(data);
    const newEntity: MembershipPaymentEntity = await this.repository.save(
      this.repository.create(persistenceModel),
    );
    return MembershipPaymentMapper.toDomain(newEntity);
  }
  async findAll(
    query: QueryMembershipPaymentDto,
  ): Promise<FindAllMembershipPayment> {
    const skip: number = query.skip ?? PAGINATION_DEFAULTS.skip;
    const take: number = query.take ?? PAGINATION_DEFAULTS.take;
    const queryBuilder =
      this.repository.createQueryBuilder('membership_payment');
    if (query.membership_id !== undefined) {
      queryBuilder.andWhere(
        'membership_payment.membership_id = :membership_id',
        { membership_id: query.membership_id },
      );
    }
    if (query.user_id !== undefined) {
      queryBuilder.andWhere('membership_payment.user_id = :user_id', {
        user_id: query.user_id,
      });
    }
    if (query.payment_status) {
      queryBuilder.andWhere(
        'membership_payment.payment_status = :payment_status',
        {
          payment_status: query.payment_status,
        },
      );
    }
    queryBuilder.orderBy('membership_payment.id', 'DESC').skip(skip).take(take);
    const [entities, totalCount]: [MembershipPaymentEntity[], number] =
      await queryBuilder.getManyAndCount();
    return {
      data: entities.map(
        (entity: MembershipPaymentEntity): MembershipPayment =>
          MembershipPaymentMapper.toDomain(entity),
      ),
      totalCount,
      skip,
      take,
    };
  }
  async findById(id: number): Promise<NullableType<MembershipPayment>> {
    const entity: MembershipPaymentEntity | null =
      await this.repository.findOne({ where: { id } });
    return entity ? MembershipPaymentMapper.toDomain(entity) : null;
  }
  async findByMembershipId(membershipId: number): Promise<MembershipPayment[]> {
    const entities: MembershipPaymentEntity[] = await this.repository.find({
      where: { membership_id: membershipId },
      order: { id: 'DESC' },
    });
    return entities.map(
      (entity: MembershipPaymentEntity): MembershipPayment =>
        MembershipPaymentMapper.toDomain(entity),
    );
  }
  async findByProviderReference(
    providerReference: string,
  ): Promise<NullableType<MembershipPayment>> {
    const entity: MembershipPaymentEntity | null =
      await this.repository.findOne({
        where: { provider_reference: providerReference },
      });
    return entity ? MembershipPaymentMapper.toDomain(entity) : null;
  }
  async update(
    id: number,
    payload: DeepPartial<MembershipPayment>,
  ): Promise<MembershipPayment> {
    const entity: MembershipPaymentEntity | null =
      await this.repository.findOne({ where: { id } });
    if (!entity) {
      throw new NotFoundException('Membership payment does not exist.');
    }
    const updateData: MembershipPaymentEntity =
      MembershipPaymentMapper.toPersistence({
        ...MembershipPaymentMapper.toDomain(entity),
        ...payload,
      } as MembershipPayment);
    const updatedEntity: MembershipPaymentEntity = await this.repository.save(
      this.repository.create(updateData),
    );
    return MembershipPaymentMapper.toDomain(updatedEntity);
  }
  async remove(id: number, causer: User): Promise<void> {
    const entity: MembershipPaymentEntity | null =
      await this.repository.findOne({ where: { id } });
    if (!entity) {
      throw new NotFoundException('Membership payment does not exist.');
    }
    const transactionManager: EntityManager = this.repository.manager;
    const causerEntity = UserMapper.toPersistence(causer);
    await transactionManager.transaction(
      async (manager: EntityManager): Promise<void> => {
        await manager.update(
          MembershipPaymentEntity,
          { id: entity.id },
          { updated_by: causerEntity, deleted_by: causerEntity },
        );
        await manager.softDelete(MembershipPaymentEntity, { id: entity.id });
      },
    );
  }
}
