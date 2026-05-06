import { CostCenter } from '@/masters/cost-centers/domain/cost-center';
import { CostCenterEntity } from '@/masters/cost-centers/persistence/entities/cost-center.entity';
import {
  getDepartment,
  getDivision,
  getSection,
  getSubSection,
  getCauser,
} from '@/utils/helpers/entity.helper';
import { Division } from '@/masters/divisions/domain/division';
import { DivisionMapper } from '@/masters/divisions/persistence/mappers/division.mapper';
import { Department } from '@/masters/departments/domain/department';
import { DepartmentMapper } from '@/masters/departments/persistence/mappers/department.mapper';
import { Section } from '@/masters/sections/domain/section';
import { SectionMapper } from '@/masters/sections/persistence/mappers/section.mapper';
import { SubSection } from '@/masters/sub-sections/domain/sub-section';
import { SubSectionMapper } from '@/masters/sub-sections/persistence/mappers/sub-section.mapper';
import { UserMapper } from '@/users/persistence/mappers/user.mapper';
import { User } from '@/users/domain/user';

/**
 * Mapper class for converting between CostCenter domain entities and CostCenterEntity persistence entities.
 *
 * This mapper handles the bidirectional conversion between the domain layer (CostCenter)
 * and the persistence layer (CostCenterEntity). It ensures proper mapping of all
 * organizational relationships and audit fields while maintaining data integrity.
 *
 * The mapper includes helper functions for extracting organizational entity names
 * and handles complex relationship mappings between domain and persistence layers.
 *
 * @version 3
 * @since 1.0.0
 * @author Masters Module Team
 *
 * @example
 * ```typescript
 * // Convert persistence entity to domain entity
 * const domainEntity = CostCenterMapper.toDomain(persistenceEntity);
 *
 * // Convert domain entity to persistence entity
 * const persistenceEntity = CostCenterMapper.toPersistence(domainEntity);
 * ```
 */
export class CostCenterMapper {
  /**
   * Converts a persistence entity to a domain entity.
   *
   * Maps all properties from the CostCenterEntity to the CostCenter domain entity,
   * including organizational relationships and audit fields. Automatically
   * generates the cost center name based on organizational structure.
   *
   * @param raw - The persistence entity to convert
   * @returns CostCenter - The domain entity with all mapped properties
   *
   * @example
   * ```typescript
   * const domainEntity = CostCenterMapper.toDomain(persistenceEntity);
   * // Returns: { id: 1, cost_center_code: '01010101', division: {...}, ... }
   * ```
   */
  static toDomain(raw: CostCenterEntity): CostCenter {
    const domainEntity = new CostCenter();

    Object.assign(domainEntity, raw);

    if (raw.division) {
      domainEntity.division = getDivision(raw.division);
    }

    if (raw.department) {
      domainEntity.department = getDepartment(raw.department);
    }

    if (raw.section) {
      domainEntity.section = getSection(raw.section);
    }

    if (raw.sub_section) {
      domainEntity.sub_section = getSubSection(raw.sub_section);
    }

    if (raw.created_by) {
      domainEntity.created_by = getCauser(raw.created_by);
    }

    if (raw.updated_by) {
      domainEntity.updated_by = getCauser(raw.updated_by);
    }

    if (raw.deleted_by) {
      domainEntity.deleted_by = getCauser(raw.deleted_by);
    }

    domainEntity.cost_center_name = getCostCenterName(domainEntity);

    return domainEntity;
  }

  /**
   * Converts a domain entity to a persistence entity.
   *
   * Maps all properties from the CostCenter domain entity to the CostCenterEntity
   * persistence entity, including organizational relationships and audit fields.
   * Handles complex relationship mappings using specialized mappers.
   *
   * @param domainEntity - The domain entity to convert
   * @returns CostCenterEntity - The persistence entity with all mapped properties
   *
   * @example
   * ```typescript
   * const persistenceEntity = CostCenterMapper.toPersistence(domainEntity);
   * // Returns: CostCenterEntity with all relationships mapped
   * ```
   */
  static toPersistence(domainEntity: CostCenter): CostCenterEntity {
    const persistenceEntity = new CostCenterEntity();

    Object.assign(
      persistenceEntity,
      domainEntity as Omit<
        CostCenter,
        | 'id'
        | 'division'
        | 'department'
        | 'section'
        | 'sub_section'
        | 'created_by'
        | 'updated_by'
        | 'deleted_by'
      >,
    );

    if (domainEntity.id) {
      persistenceEntity.id = domainEntity.id;
    }

    if (domainEntity.division) {
      persistenceEntity.division = DivisionMapper.toPersistence(
        domainEntity.division as Division,
      );
    }

    if (domainEntity.department) {
      persistenceEntity.department = DepartmentMapper.toPersistence(
        domainEntity.department as Department,
      );
    }

    if (domainEntity.section) {
      persistenceEntity.section = SectionMapper.toPersistence(
        domainEntity.section as Section,
      );
    }

    if (domainEntity.sub_section) {
      persistenceEntity.sub_section = SubSectionMapper.toPersistence(
        domainEntity.sub_section as SubSection,
      );
    }

    if (domainEntity.created_by) {
      persistenceEntity.created_by = UserMapper.toPersistence(
        domainEntity.created_by as User,
      );
    }

    if (domainEntity.updated_by) {
      persistenceEntity.updated_by = UserMapper.toPersistence(
        domainEntity.updated_by as User,
      );
    }

    if (domainEntity.deleted_by) {
      persistenceEntity.deleted_by = UserMapper.toPersistence(
        domainEntity.deleted_by as User,
      );
    }

    return persistenceEntity;
  }
}

/**
 * Helper function to extract the cost center name from organizational entities.
 *
 * This function determines the most specific organizational entity name
 * by checking the hierarchy: sub-section > section > department > division.
 * Returns the name of the lowest level organizational entity that exists.
 *
 * @param costCenter - The cost center domain entity
 * @returns string | undefined - The name of the most specific organizational entity
 *
 * @example
 * ```typescript
 * const name = getCostCenterName(costCenter);
 * // Returns: 'Backend' (from sub_section.sub_section_name)
 * ```
 */
const getCostCenterName = function (costCenter: CostCenter) {
  const entities: (string | null)[] = [
    costCenter.division?.division_name ?? null,
    costCenter.department?.department_name ?? null,
    costCenter.section?.section_name ?? null,
    costCenter.sub_section?.sub_section_name ?? null,
  ];

  const name = entities.filter((entity) => entity != null);

  return name.pop();
};
