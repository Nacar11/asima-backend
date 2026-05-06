import { CostCenter } from '@/cost-centers/domain/cost-center';
import { CostCenterEntity } from '@/cost-centers/persistence/entities/cost-center.entity';
import {
  getDepartment,
  getDivision,
  getSection,
  getSubSection,
  getCauser,
} from '@/utils/helpers/entity.helper';
import { Division } from '@/divisions/domain/division';
import { DivisionMapper } from '@/divisions/persistence/mappers/division.mapper';
import { Department } from '@/departments/domain/department';
import { DepartmentMapper } from '@/departments/persistence/mappers/department.mapper';
import { Section } from '@/sections/domain/section';
import { SectionMapper } from '@/sections/persistence/mappers/section.mapper';
import { SubSection } from '@/sub-sections/domain/sub-section';
import { SubSectionMapper } from '@/sub-sections/persistence/mappers/sub-section.mapper';
import { UserMapper } from '@/users/persistence/mappers/user.mapper';
import { User } from '@/users/domain/user';

/**
 * Cost Center Mapper
 *
 * Handles conversion between domain and persistence entities for cost centers.
 * Maps cost center entities with complete related entity data including:
 * - Division, department, section, and sub-section information
 * - User audit information (created_by, updated_by, deleted_by)
 * - Computed cost_center_name field
 *
 * The mapper ensures that all related entities are properly transformed
 * between domain and persistence layers, maintaining data integrity.
 *
 * @example
 * ```typescript
 * // Convert persistence entity to domain
 * const domainEntity = CostCenterMapper.toDomain(persistenceEntity);
 * // Returns complete cost center with all relations mapped
 * ```
 *
 * @author Cody Inc Development Team
 * @since 1.0.0
 */
export class CostCenterMapper {
  /**
   * Converts a persistence entity to a domain entity
   *
   * Maps all related entities from persistence to domain format:
   * - Division, department, section, and sub-section entities
   * - User audit entities (created_by, updated_by, deleted_by)
   * - Computes the cost_center_name field
   *
   * @param raw - The persistence entity from the database
   * @returns CostCenter - The domain entity with all relations mapped
   *
   * @example
   * ```typescript
   * const domainEntity = CostCenterMapper.toDomain(persistenceEntity);
   * // Returns complete cost center with division, department, section, sub_section, and user audit data
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
 * Generates the cost center name from the hierarchical organization structure
 *
 * Creates a human-readable name by combining the names from the organizational
 * hierarchy (division, department, section, sub-section) and returning the
 * most specific (deepest) level name available.
 *
 * @param costCenter - The cost center entity with related organizational entities
 * @returns string | undefined - The computed cost center name or undefined if no names are available
 *
 * @example
 * ```typescript
 * const costCenterName = getCostCenterName(costCenter);
 * // Returns the most specific organizational name (e.g., "Backend Development" from sub_section)
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
