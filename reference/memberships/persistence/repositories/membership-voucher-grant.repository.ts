import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { MembershipVoucherGrantEntity } from '@/memberships/persistence/entities/membership-voucher-grant.entity';
import { BaseMembershipVoucherGrantRepository } from '@/memberships/persistence/base-membership-voucher-grant.repository';
import { MembershipVoucherGrant } from '@/memberships/domain/membership-voucher-grant';
import { MembershipVoucherGrantMapper } from '@/memberships/persistence/mappers/membership-voucher-grant.mapper';
import { QueryMembershipVoucherGrantDto } from '@/memberships/dto/query-membership-voucher-grant.dto';
import { FindAllMembershipVoucherGrant } from '@/memberships/domain/find-all-membership-voucher-grant';
import { NullableType } from '@/utils/types/nullable.type';
import { PAGINATION_DEFAULTS } from '@/utils/constants/pagination.constants';
import { User } from '@/users/domain/user';
import { UserMapper } from '@/users/persistence/mappers/user.mapper';
import { DeepPartial } from 'typeorm';

@Injectable()
export class MembershipVoucherGrantRepository
  implements BaseMembershipVoucherGrantRepository
{
  constructor(
    @InjectRepository(MembershipVoucherGrantEntity)
    private readonly repository: Repository<MembershipVoucherGrantEntity>,
  ) {}
  async create(
    data: Partial<MembershipVoucherGrant>,
  ): Promise<MembershipVoucherGrant> {
    const persistenceModel: MembershipVoucherGrantEntity =
      MembershipVoucherGrantMapper.toPersistence(data);
    const newEntity: MembershipVoucherGrantEntity = await this.repository.save(
      this.repository.create(persistenceModel),
    );
    return MembershipVoucherGrantMapper.toDomain(newEntity);
  }
  async findAll(
    query: QueryMembershipVoucherGrantDto,
  ): Promise<FindAllMembershipVoucherGrant> {
    const skip: number = query.skip ?? PAGINATION_DEFAULTS.skip;
    const take: number = query.take ?? PAGINATION_DEFAULTS.take;
    const queryBuilder = this.repository.createQueryBuilder(
      'membership_voucher_grant',
    );
    if (query.membership_id !== undefined) {
      queryBuilder.andWhere(
        'membership_voucher_grant.membership_id = :membership_id',
        { membership_id: query.membership_id },
      );
    }
    if (query.membership_payment_id !== undefined) {
      queryBuilder.andWhere(
        'membership_voucher_grant.membership_payment_id = :membership_payment_id',
        { membership_payment_id: query.membership_payment_id },
      );
    }
    if (query.user_id !== undefined) {
      queryBuilder.andWhere('membership_voucher_grant.user_id = :user_id', {
        user_id: query.user_id,
      });
    }
    queryBuilder
      .orderBy('membership_voucher_grant.id', 'DESC')
      .skip(skip)
      .take(take);
    const [entities, totalCount]: [MembershipVoucherGrantEntity[], number] =
      await queryBuilder.getManyAndCount();
    return {
      data: entities.map(
        (entity: MembershipVoucherGrantEntity): MembershipVoucherGrant =>
          MembershipVoucherGrantMapper.toDomain(entity),
      ),
      totalCount,
      skip,
      take,
    };
  }
  async findById(id: number): Promise<NullableType<MembershipVoucherGrant>> {
    const entity: MembershipVoucherGrantEntity | null =
      await this.repository.findOne({ where: { id } });
    return entity ? MembershipVoucherGrantMapper.toDomain(entity) : null;
  }
  async findByMembershipId(
    membershipId: number,
  ): Promise<MembershipVoucherGrant[]> {
    const entities: MembershipVoucherGrantEntity[] = await this.repository.find(
      {
        where: { membership_id: membershipId },
        order: { id: 'DESC' },
      },
    );
    return entities.map(
      (entity: MembershipVoucherGrantEntity): MembershipVoucherGrant =>
        MembershipVoucherGrantMapper.toDomain(entity),
    );
  }
  async update(
    id: number,
    payload: DeepPartial<MembershipVoucherGrant>,
  ): Promise<MembershipVoucherGrant> {
    const entity: MembershipVoucherGrantEntity | null =
      await this.repository.findOne({ where: { id } });
    if (!entity) {
      throw new NotFoundException('Membership voucher grant does not exist.');
    }
    const updateData: MembershipVoucherGrantEntity =
      MembershipVoucherGrantMapper.toPersistence({
        ...MembershipVoucherGrantMapper.toDomain(entity),
        ...payload,
      } as MembershipVoucherGrant);
    const updatedEntity: MembershipVoucherGrantEntity =
      await this.repository.save(this.repository.create(updateData));
    return MembershipVoucherGrantMapper.toDomain(updatedEntity);
  }
  async remove(id: number, causer: User): Promise<void> {
    const entity: MembershipVoucherGrantEntity | null =
      await this.repository.findOne({ where: { id } });
    if (!entity) {
      throw new NotFoundException('Membership voucher grant does not exist.');
    }
    const transactionManager: EntityManager = this.repository.manager;
    const causerEntity = UserMapper.toPersistence(causer);
    await transactionManager.transaction(
      async (manager: EntityManager): Promise<void> => {
        await manager.update(
          MembershipVoucherGrantEntity,
          { id: entity.id },
          { updated_by: causerEntity, deleted_by: causerEntity },
        );
        await manager.softDelete(MembershipVoucherGrantEntity, {
          id: entity.id,
        });
      },
    );
  }
}
