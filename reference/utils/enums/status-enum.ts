export enum StatusEnum {
  ACTIVE = 'Active',
  CANCELLED = 'Cancelled',
  HOLD = 'Hold',
}

export enum ActiveInactiveStatusEnum {
  ACTIVE = 'Active',
  INACTIVE = 'Inactive',
}

export enum MasterStatusEnum {
  ACTIVE = 'Active',
  CANCELLED = 'Cancelled',
  NEW = 'New',
  HOLD = 'Hold',
}

export enum SimpleTransactionalStatusEnum {
  NEW = 'New',
  APPROVED = 'Approved',
  CANCELLED = 'Cancelled',
}

export enum TransactionalStatusEnum {
  NEW = 'New',
  ENDORSED = 'Endorsed',
  REVIEWED = 'Reviewed',
  APPROVED = 'Approved',
  DISAPPROVED = 'Disapproved',
  FULFILLED = 'Fulfilled',
  CANCELLED = 'Cancelled',
  HOLD = 'Hold',
}
