import { User } from '@/users/domain/user';
import { UserEntity } from '@/users/persistence/entities/user.entity';
import { UserMapper } from '@/users/persistence/mappers/user.mapper';
import { DivisionEntity } from '@/divisions/persistence/entities/division.entity';
import { DepartmentEntity } from '@/departments/persistence/entities/department.entity';
import { SectionEntity } from '@/sections/persistence/entities/section.entity';
import { SubSectionEntity } from '@/sub-sections/persistence/entities/sub-section.entity';
import { Division } from '@/divisions/domain/division';
import { DivisionMapper } from '@/divisions/persistence/mappers/division.mapper';
import { Department } from '@/departments/domain/department';
import { Section } from '@/sections/domain/section';
import { SubSection } from '@/sub-sections/domain/sub-section';
import { DepartmentMapper } from '@/departments/persistence/mappers/department.mapper';
import { SectionMapper } from '@/sections/persistence/mappers/section.mapper';
import { SubSectionMapper } from '@/sub-sections/persistence/mappers/sub-section.mapper';
import { CostCenter } from '@/cost-centers/domain/cost-center';
import { CostCenterMapper } from '@/cost-centers/persistence/mappers/cost-center.mapper';
import { Causer } from '@/utils/domain/causer';
import { MenuEntity } from '@/menus/persistence/entities/menu.entity';
import { Menu } from '@/menus/domain/menu';
import { Seller } from '@/sellers/domain/seller';
import { SellerEntity } from '@/sellers/persistence/entities/seller.entity';

export const getCauser = ({ id, first_name, last_name }: UserEntity): Causer =>
  ({
    id,
    first_name,
    last_name,
  }) as Causer;

export const getUser = (user: UserEntity): User => {
  const mappedUser = mapToDomain(UserMapper, user, [
    'id',
    'first_name',
    'last_name',
    'middle_name',
    'suffix',
    'cost_center',
    'email',
    'device_pin',
    'image',
    'user_id',
  ]);

  if (mappedUser.cost_center) {
    mappedUser.cost_center = getCostCenter(mappedUser.cost_center);
  }

  return mappedUser;
};

export const getCostCenter = (costCenter: CostCenter): CostCenter => {
  const mapperCostCenter = mapToDomain(CostCenterMapper, costCenter, [
    'id',
    'cost_center_code',
    'cost_center_name',
  ]);
  return mapperCostCenter;
};

export const getDivision = (division: DivisionEntity): Division => {
  const mappedDivision = mapToDomain(DivisionMapper, division, [
    'id',
    'division_code',
    'division_name',
  ]);
  return mappedDivision;
};

export const getDepartment = (department: DepartmentEntity): Department => {
  const mappedDepartment = mapToDomain(DepartmentMapper, department, [
    'id',
    'department_code',
    'department_name',
  ]);
  return mappedDepartment;
};

export const getSection = (section: SectionEntity): Section => {
  const mappedSection = mapToDomain(SectionMapper, section, [
    'id',
    'section_code',
    'section_name',
  ]);
  return mappedSection;
};

export const getSubSection = (subSection: SubSectionEntity): SubSection => {
  const mappedSubSection = mapToDomain(SubSectionMapper, subSection, [
    'id',
    'sub_section_code',
    'sub_section_name',
  ]);
  return mappedSubSection;
};

export const getMenu = ({ id, menu_code, menu_name }: MenuEntity): Menu =>
  ({
    id,
    menu_code,
    menu_name,
  }) as Menu;

export const getSeller = (seller: SellerEntity): Seller => {
  const domainSeller = new Seller();

  // Map basic seller properties (exclude user to avoid circular reference)
  domainSeller.id = seller.id;
  domainSeller.user_id = seller.user_id;
  domainSeller.store_name = seller.store_name;
  domainSeller.store_description = seller.store_description;
  domainSeller.store_logo_url = seller.store_logo_url;
  domainSeller.store_banner_url = seller.store_banner_url;
  domainSeller.business_registration_number =
    seller.business_registration_number;
  domainSeller.tax_id = seller.tax_id;
  domainSeller.bank_account_holder = seller.bank_account_holder;
  domainSeller.bank_account_number = seller.bank_account_number;
  domainSeller.bank_name = seller.bank_name;
  domainSeller.is_verified = seller.is_verified;
  domainSeller.is_active = seller.is_active;
  domainSeller.total_sales = seller.total_sales;
  domainSeller.total_reviews = seller.total_reviews;
  domainSeller.status = seller.status;
  domainSeller.created_at = seller.created_at;
  domainSeller.updated_at = seller.updated_at;

  return domainSeller;
};

function mapToDomain<T>(
  mapper: { toDomain: (entity: any) => T },
  entity: any,
  keys: (keyof T)[],
): T {
  const mappedEntity = mapper.toDomain(entity);

  return Object.fromEntries(
    keys
      .filter((key) => mappedEntity[key] !== undefined)
      .map((key) => [key, mappedEntity[key]]),
  ) as T;
}
