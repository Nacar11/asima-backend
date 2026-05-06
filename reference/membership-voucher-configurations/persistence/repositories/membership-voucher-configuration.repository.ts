import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, EntityManager, Repository } from 'typeorm';
import { PAGINATION_DEFAULTS } from '@/utils/constants/pagination.constants';
import { User } from '@/users/domain/user';
import { UserMapper } from '@/users/persistence/mappers/user.mapper';
import { BaseMembershipVoucherConfigurationRepository } from '@/membership-voucher-configurations/persistence/base-membership-voucher-configuration.repository';
import { MembershipVoucherConfiguration } from '@/membership-voucher-configurations/domain/membership-voucher-configuration';
import { MembershipVoucherConfigurationEntity } from '@/membership-voucher-configurations/persistence/entities/membership-voucher-configuration.entity';
import { MembershipVoucherConfigurationMapper } from '@/membership-voucher-configurations/persistence/mappers/membership-voucher-configuration.mapper';
import { QueryMembershipVoucherConfigurationDto } from '@/membership-voucher-configurations/dto/query-membership-voucher-configuration.dto';
import { FindAllMembershipVoucherConfiguration } from '@/membership-voucher-configurations/domain/find-all-membership-voucher-configuration';
import { NullableType } from '@/utils/types/nullable.type';

@Injectable()
export class MembershipVoucherConfigurationRepository
  implements BaseMembershipVoucherConfigurationRepository
{
  constructor(
    @InjectRepository(MembershipVoucherConfigurationEntity)
    private readonly repository: Repository<MembershipVoucherConfigurationEntity>,
  ) {}

  async create(
    data: Partial<MembershipVoucherConfiguration>,
  ): Promise<MembershipVoucherConfiguration> {
    const persistenceModel: MembershipVoucherConfigurationEntity =
      MembershipVoucherConfigurationMapper.toPersistence(data);
    const newEntity: MembershipVoucherConfigurationEntity =
      await this.repository.save(this.repository.create(persistenceModel));
    const hydratedEntity: MembershipVoucherConfigurationEntity =
      await this.findPersistenceByIdOrFail(newEntity.id);
    return MembershipVoucherConfigurationMapper.toDomain(hydratedEntity);
  }

  async findAll(
    query: QueryMembershipVoucherConfigurationDto,
  ): Promise<FindAllMembershipVoucherConfiguration> {
    const skip: number = query.skip ?? PAGINATION_DEFAULTS.skip;
    const take: number = query.take ?? PAGINATION_DEFAULTS.take;
    const queryBuilder = this.repository
      .createQueryBuilder('membership_voucher_configuration')
      .leftJoinAndSelect('membership_voucher_configuration.voucher', 'voucher');
    if (query.membership_plan_id !== undefined) {
      queryBuilder.andWhere(
        'membership_voucher_configuration.membership_plan_id = :membershipPlanId',
        {
          membershipPlanId: query.membership_plan_id,
        },
      );
    }
    if (query.voucher_id !== undefined) {
      queryBuilder.andWhere(
        'membership_voucher_configuration.voucher_id = :voucherId',
        {
          voucherId: query.voucher_id,
        },
      );
    }
    if (query.is_active !== undefined) {
      queryBuilder.andWhere(
        'membership_voucher_configuration.is_active = :isActive',
        {
          isActive: query.is_active,
        },
      );
    }
    queryBuilder
      .orderBy('membership_voucher_configuration.id', 'DESC')
      .skip(skip)
      .take(take);
    const [entities, totalCount]: [
      MembershipVoucherConfigurationEntity[],
      number,
    ] = await queryBuilder.getManyAndCount();
    return {
      data: entities.map(
        (
          entity: MembershipVoucherConfigurationEntity,
        ): MembershipVoucherConfiguration =>
          MembershipVoucherConfigurationMapper.toDomain(entity),
      ),
      totalCount,
      skip,
      take,
    };
  }

  async findById(
    id: MembershipVoucherConfiguration['id'],
  ): Promise<NullableType<MembershipVoucherConfiguration>> {
    const entity: MembershipVoucherConfigurationEntity | null =
      await this.repository.findOne({
        where: { id },
        relations: ['voucher'],
      });
    return entity
      ? MembershipVoucherConfigurationMapper.toDomain(entity)
      : null;
  }

  async update(
    id: MembershipVoucherConfiguration['id'],
    payload: DeepPartial<MembershipVoucherConfiguration>,
  ): Promise<MembershipVoucherConfiguration> {
    const entity: MembershipVoucherConfigurationEntity | null =
      await this.repository.findOne({ where: { id } });
    if (!entity) {
      throw new NotFoundException(
        'Membership voucher configuration does not exist.',
      );
    }
    const updateData: MembershipVoucherConfigurationEntity =
      MembershipVoucherConfigurationMapper.toPersistence({
        ...MembershipVoucherConfigurationMapper.toDomain(entity),
        ...payload,
      } as MembershipVoucherConfiguration);
    await this.repository.save(this.repository.create(updateData));
    const hydratedEntity: MembershipVoucherConfigurationEntity =
      await this.findPersistenceByIdOrFail(id);
    return MembershipVoucherConfigurationMapper.toDomain(hydratedEntity);
  }

  async remove(
    id: MembershipVoucherConfiguration['id'],
    causer: User,
  ): Promise<void> {
    const entity: MembershipVoucherConfigurationEntity | null =
      await this.repository.findOne({ where: { id } });
    if (!entity) {
      throw new NotFoundException(
        'Membership voucher configuration does not exist.',
      );
    }
    const transactionManager: EntityManager = this.repository.manager;
    const causerEntity = UserMapper.toPersistence(causer);
    await transactionManager.transaction(
      async (manager: EntityManager): Promise<void> => {
        await manager.update(
          MembershipVoucherConfigurationEntity,
          { id: entity.id },
          { updated_by: causerEntity, deleted_by: causerEntity },
        );
        await manager.softDelete(MembershipVoucherConfigurationEntity, {
          id: entity.id,
        });
      },
    );
  }

  private async findPersistenceByIdOrFail(
    id: MembershipVoucherConfiguration['id'],
  ): Promise<MembershipVoucherConfigurationEntity> {
    const entity: MembershipVoucherConfigurationEntity | null =
      await this.repository.findOne({
        where: { id },
        relations: ['voucher'],
      });
    if (!entity) {
      throw new NotFoundException(
        'Membership voucher configuration does not exist.',
      );
    }
    return entity;
  }
}
