import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import {
  EvaluateServiceOptionPricingInput,
  EvaluatedServiceOptionPricingResult,
  ServiceOptionPricingRule,
  ServiceOptionPricingRuleCondition,
} from './domain/service-option-pricing-rule';
import { CreateServiceOptionPricingRuleDto } from './dto/create-service-option-pricing-rule.dto';
import { UpdateServiceOptionPricingRuleDto } from './dto/update-service-option-pricing-rule.dto';
import { QueryServiceOptionPricingRuleDto } from './dto/query-service-option-pricing-rule.dto';
import { ServiceOptionPricingRuleEntity } from './persistence/entities/service-option-pricing-rule.entity';
import { ServiceOptionPricingRuleConditionEntity } from './persistence/entities/service-option-pricing-rule-condition.entity';
import { ServicesService } from '@/services/services.service';
import { ServiceOptionGroupsService } from '@/service-option-groups/service-option-groups.service';
import { User } from '@/users/domain/user';

@Injectable()
export class ServiceOptionPricingRulesService {
  constructor(
    @InjectRepository(ServiceOptionPricingRuleEntity)
    private readonly ruleRepository: Repository<ServiceOptionPricingRuleEntity>,
    @InjectRepository(ServiceOptionPricingRuleConditionEntity)
    private readonly conditionRepository: Repository<ServiceOptionPricingRuleConditionEntity>,
    private readonly servicesService: ServicesService,
    private readonly serviceOptionGroupsService: ServiceOptionGroupsService,
  ) {}

  private toDomain(
    raw: ServiceOptionPricingRuleEntity,
  ): ServiceOptionPricingRule {
    const item = new ServiceOptionPricingRule();
    item.id = raw.id;
    item.service_id = raw.service_id;
    item.name = raw.name;
    item.code = raw.code;
    item.description = raw.description;
    item.price_adjustment = Number(raw.price_adjustment ?? 0);
    item.duration_adjustment_minutes = raw.duration_adjustment_minutes ?? 0;
    item.priority = raw.priority ?? 0;
    item.is_active = Boolean(raw.is_active);
    item.created_by = raw.created_by?.id ?? null;
    item.created_at = raw.created_at;
    item.updated_by = raw.updated_by?.id ?? null;
    item.updated_at = raw.updated_at;
    item.deleted_by = raw.deleted_by?.id ?? null;
    item.deleted_at = raw.deleted_at ?? null;
    item.conditions = (raw.conditions || []).map((condition) => {
      const conditionDomain = new ServiceOptionPricingRuleCondition();
      conditionDomain.id = condition.id;
      conditionDomain.option_group_id = condition.option_group_id;
      conditionDomain.option_value_id = condition.option_value_id;
      conditionDomain.option_group_name = condition.option_group?.name ?? null;
      conditionDomain.option_value_label =
        condition.option_value?.label ?? null;
      return conditionDomain;
    });
    return item;
  }

  private async ensureCodeUnique(
    serviceId: number,
    code: string,
    excludeRuleId?: number,
  ): Promise<void> {
    const query = this.ruleRepository.createQueryBuilder('rule');
    query
      .where('rule.service_id = :serviceId', { serviceId })
      .andWhere('LOWER(rule.code) = LOWER(:code)', { code })
      .andWhere('rule.deleted_at IS NULL');

    if (excludeRuleId) {
      query.andWhere('rule.id != :excludeRuleId', { excludeRuleId });
    }

    const existing = await query.getOne();
    if (existing) {
      throw new ConflictException(
        'Pricing rule code already exists for this service',
      );
    }
  }

  private async validateAndNormalizeConditions(input: {
    serviceId: number;
    conditions: Array<{ option_group_id: number; option_value_id: number }>;
  }): Promise<Array<{ option_group_id: number; option_value_id: number }>> {
    const { serviceId, conditions } = input;

    if (!conditions || conditions.length === 0) {
      throw new BadRequestException(
        'At least one condition is required for a pricing rule',
      );
    }

    const serviceOptionGroups =
      await this.serviceOptionGroupsService.findByServiceId(serviceId);

    if (serviceOptionGroups.length === 0) {
      throw new BadRequestException(
        'This service has no option groups. Create option groups first.',
      );
    }

    const groupById = new Map(
      serviceOptionGroups.map((group) => [group.id, group]),
    );
    const seenGroupIds = new Set<number>();

    return conditions.map((condition) => {
      const group = groupById.get(condition.option_group_id);
      if (!group) {
        throw new BadRequestException(
          `Option group ${condition.option_group_id} does not belong to this service`,
        );
      }

      if (seenGroupIds.has(condition.option_group_id)) {
        throw new BadRequestException(
          `Duplicate condition for option group ${condition.option_group_id}`,
        );
      }
      seenGroupIds.add(condition.option_group_id);

      const hasValueInGroup = (group.option_values || []).some(
        (value) => value.id === condition.option_value_id,
      );

      if (!hasValueInGroup) {
        throw new BadRequestException(
          `Option value ${condition.option_value_id} does not belong to option group ${condition.option_group_id}`,
        );
      }

      return {
        option_group_id: condition.option_group_id,
        option_value_id: condition.option_value_id,
      };
    });
  }

  private async findRuleEntityById(
    id: number,
  ): Promise<ServiceOptionPricingRuleEntity> {
    const entity = await this.ruleRepository.findOne({
      where: { id, deleted_at: IsNull() },
      relations: [
        'conditions',
        'conditions.option_group',
        'conditions.option_value',
        'created_by',
        'updated_by',
        'deleted_by',
      ],
    });

    if (!entity) {
      throw new NotFoundException('Service option pricing rule not found');
    }

    return entity;
  }

  async create(
    dto: CreateServiceOptionPricingRuleDto,
    currentUser: User,
  ): Promise<ServiceOptionPricingRule> {
    await this.servicesService.findById(dto.service_id);
    await this.ensureCodeUnique(dto.service_id, dto.code);

    const normalizedConditions = await this.validateAndNormalizeConditions({
      serviceId: dto.service_id,
      conditions: dto.conditions,
    });

    const createdRule = await this.ruleRepository.save(
      this.ruleRepository.create({
        service_id: dto.service_id,
        name: dto.name,
        code: dto.code,
        description: dto.description ?? null,
        price_adjustment: dto.price_adjustment,
        duration_adjustment_minutes: dto.duration_adjustment_minutes ?? 0,
        priority: dto.priority ?? 0,
        is_active: dto.is_active ?? true,
        created_by: currentUser?.id ? ({ id: currentUser.id } as any) : null,
        updated_by: currentUser?.id ? ({ id: currentUser.id } as any) : null,
      }),
    );

    await this.conditionRepository.save(
      normalizedConditions.map((condition) =>
        this.conditionRepository.create({
          rule_id: createdRule.id,
          option_group_id: condition.option_group_id,
          option_value_id: condition.option_value_id,
        }),
      ),
    );

    return this.findById(createdRule.id);
  }

  async findAll(query: QueryServiceOptionPricingRuleDto): Promise<{
    data: ServiceOptionPricingRule[];
    totalCount: number;
  }> {
    const skip = query.skip ?? 0;
    const take = query.take ?? 20;

    const qb = this.ruleRepository
      .createQueryBuilder('rule')
      .leftJoinAndSelect('rule.conditions', 'condition')
      .leftJoinAndSelect('condition.option_group', 'option_group')
      .leftJoinAndSelect('condition.option_value', 'option_value')
      .leftJoinAndSelect('rule.created_by', 'created_by')
      .leftJoinAndSelect('rule.updated_by', 'updated_by')
      .where('rule.deleted_at IS NULL');

    if (query.service_id !== undefined) {
      qb.andWhere('rule.service_id = :serviceId', {
        serviceId: query.service_id,
      });
    }

    if (query.is_active !== undefined) {
      qb.andWhere('rule.is_active = :isActive', {
        isActive: query.is_active,
      });
    }

    if (query.search) {
      qb.andWhere(
        '(LOWER(rule.name) LIKE LOWER(:search) OR LOWER(rule.code) LIKE LOWER(:search))',
        {
          search: `%${query.search}%`,
        },
      );
    }

    qb.orderBy('rule.priority', 'DESC')
      .addOrderBy('rule.id', 'ASC')
      .addOrderBy('condition.id', 'ASC')
      .skip(skip)
      .take(take);

    const [entities, totalCount] = await qb.getManyAndCount();

    return {
      data: entities.map((entity) => this.toDomain(entity)),
      totalCount,
    };
  }

  async findById(id: number): Promise<ServiceOptionPricingRule> {
    const entity = await this.findRuleEntityById(id);
    return this.toDomain(entity);
  }

  async findByServiceId(
    serviceId: number,
  ): Promise<ServiceOptionPricingRule[]> {
    const entities = await this.ruleRepository.find({
      where: {
        service_id: serviceId,
        deleted_at: IsNull(),
      },
      relations: [
        'conditions',
        'conditions.option_group',
        'conditions.option_value',
      ],
      order: {
        priority: 'DESC',
        id: 'ASC',
      },
    });

    return entities.map((entity) => this.toDomain(entity));
  }

  async update(
    id: number,
    dto: UpdateServiceOptionPricingRuleDto,
    currentUser: User,
  ): Promise<ServiceOptionPricingRule> {
    const existing = await this.findRuleEntityById(id);

    if (dto.code !== undefined && dto.code !== existing.code) {
      await this.ensureCodeUnique(existing.service_id, dto.code, existing.id);
    }

    if (dto.conditions !== undefined) {
      await this.validateAndNormalizeConditions({
        serviceId: existing.service_id,
        conditions: dto.conditions,
      });
    }

    await this.ruleRepository.save({
      id: existing.id,
      name: dto.name ?? existing.name,
      code: dto.code ?? existing.code,
      description:
        dto.description !== undefined ? dto.description : existing.description,
      price_adjustment:
        dto.price_adjustment !== undefined
          ? dto.price_adjustment
          : existing.price_adjustment,
      duration_adjustment_minutes:
        dto.duration_adjustment_minutes !== undefined
          ? dto.duration_adjustment_minutes
          : existing.duration_adjustment_minutes,
      priority: dto.priority ?? existing.priority,
      is_active:
        dto.is_active !== undefined ? dto.is_active : existing.is_active,
      updated_by: currentUser?.id ? ({ id: currentUser.id } as any) : null,
    });

    if (dto.conditions !== undefined) {
      await this.conditionRepository.delete({ rule_id: existing.id });
      await this.conditionRepository.save(
        dto.conditions.map((condition) =>
          this.conditionRepository.create({
            rule_id: existing.id,
            option_group_id: condition.option_group_id,
            option_value_id: condition.option_value_id,
          }),
        ),
      );
    }

    return this.findById(existing.id);
  }

  async remove(id: number, currentUser: User): Promise<void> {
    await this.findRuleEntityById(id);

    await this.ruleRepository.save({
      id,
      deleted_at: new Date(),
      deleted_by: currentUser?.id ? ({ id: currentUser.id } as any) : null,
      is_active: false,
    });
  }

  async evaluateBestMatch(
    input: EvaluateServiceOptionPricingInput,
  ): Promise<EvaluatedServiceOptionPricingResult> {
    const { serviceId, selections } = input;

    if (!selections || selections.length === 0) {
      return {
        matched_rule_id: null,
        matched_rule_code: null,
        price_adjustment: 0,
        duration_adjustment_minutes: 0,
      };
    }

    const rules = await this.findByServiceId(serviceId);
    const activeRules = rules.filter((rule) => rule.is_active);

    if (activeRules.length === 0) {
      return {
        matched_rule_id: null,
        matched_rule_code: null,
        price_adjustment: 0,
        duration_adjustment_minutes: 0,
      };
    }

    const selectedKeySet = new Set(
      selections.map(
        (selection) =>
          `${selection.option_group_id}:${selection.option_value_id}`,
      ),
    );

    let bestRule: ServiceOptionPricingRule | null = null;
    let bestSpecificity = -1;

    for (const rule of activeRules) {
      const conditions = rule.conditions || [];
      if (conditions.length === 0) {
        continue;
      }

      const matched = conditions.every((condition) =>
        selectedKeySet.has(
          `${condition.option_group_id}:${condition.option_value_id}`,
        ),
      );

      if (!matched) {
        continue;
      }

      const specificity = conditions.length;
      const shouldReplaceBest =
        !bestRule ||
        specificity > bestSpecificity ||
        (specificity === bestSpecificity &&
          rule.priority > bestRule.priority) ||
        (specificity === bestSpecificity &&
          rule.priority === bestRule.priority &&
          rule.id < bestRule.id);

      if (shouldReplaceBest) {
        bestRule = rule;
        bestSpecificity = specificity;
      }
    }

    if (!bestRule) {
      return {
        matched_rule_id: null,
        matched_rule_code: null,
        price_adjustment: 0,
        duration_adjustment_minutes: 0,
      };
    }

    return {
      matched_rule_id: bestRule.id,
      matched_rule_code: bestRule.code,
      price_adjustment: Number(bestRule.price_adjustment ?? 0),
      duration_adjustment_minutes: bestRule.duration_adjustment_minutes ?? 0,
    };
  }
}
