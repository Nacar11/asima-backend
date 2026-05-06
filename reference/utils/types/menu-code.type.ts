import {
  AdminContentEnum,
  CommonMasterEnum,
  InventoryEnum,
  LMSEnum,
  ProcurementEnum,
  ProductionMFQAndQAEnum,
  ProductionPlanningAndMRP,
  SalesEnum,
  StoreManagementEnum,
} from '@/utils/enums/menu-code';

export type MenuCode =
  | ProcurementEnum
  | InventoryEnum
  | SalesEnum
  | ProductionMFQAndQAEnum
  | ProductionPlanningAndMRP
  | CommonMasterEnum
  | LMSEnum
  | StoreManagementEnum
  | AdminContentEnum;
