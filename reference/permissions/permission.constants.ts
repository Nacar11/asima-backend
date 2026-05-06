// Permission Types
export const PERMISSIONS = {
  VIEW: 'View',
  CREATE: 'Create',
  EDIT: 'Edit',
  DELETE: 'Delete',
  ENDORSE: 'Endorse',
  REVIEW: 'Review',
  APPROVE: 'Approve',
  UPLOAD: 'Upload',
} as const;

// Shorthand for common permission sets
export const ALL_PERMISSIONS = [
  PERMISSIONS.VIEW,
  PERMISSIONS.CREATE,
  PERMISSIONS.EDIT,
  PERMISSIONS.DELETE,
  PERMISSIONS.ENDORSE,
  PERMISSIONS.REVIEW,
  PERMISSIONS.APPROVE,
  PERMISSIONS.UPLOAD,
];

export const FULL_ACCESS = [
  PERMISSIONS.VIEW,
  PERMISSIONS.CREATE,
  PERMISSIONS.EDIT,
  PERMISSIONS.DELETE,
];
export const READ_ONLY = [PERMISSIONS.VIEW];
export const READ_WRITE = [PERMISSIONS.VIEW, PERMISSIONS.EDIT];
export const READ_WRITE_DELETE = [
  PERMISSIONS.VIEW,
  PERMISSIONS.EDIT,
  PERMISSIONS.DELETE,
];
export const READ_CREATE = [PERMISSIONS.VIEW, PERMISSIONS.CREATE];
export const READ_CREATE_EDIT = [
  PERMISSIONS.VIEW,
  PERMISSIONS.CREATE,
  PERMISSIONS.EDIT,
];

// Extended permission sets including workflow permissions
export const FULL_ACCESS_WITH_WORKFLOW = [
  PERMISSIONS.VIEW,
  PERMISSIONS.CREATE,
  PERMISSIONS.EDIT,
  PERMISSIONS.DELETE,
  PERMISSIONS.ENDORSE,
  PERMISSIONS.REVIEW,
  PERMISSIONS.APPROVE,
];

export const WORKFLOW_PERMISSIONS = [
  PERMISSIONS.ENDORSE,
  PERMISSIONS.REVIEW,
  PERMISSIONS.APPROVE,
];

// Permission Hierarchy - Groups inherit from other groups
export const PERMISSION_HIERARCHY: Record<string, string[]> = {
  Admin: [], // system_admin bypasses all checks
  'Store Owner': ['Store Member'],
  'Store Member': ['Customer'],
  Customer: [],
};

// Resource filter types
export enum ResourceFilterType {
  NONE = 'none', // No filtering (global access)
  STORE = 'store_id', // Filter by user's store/seller
  CUSTOMER = 'customer_id', // Filter by customer's own data
  STORE_OR_CUSTOMER = 'store_or_customer', // Either store owner OR customer's own
}

// Menu to Resource Filter mapping
export const MENU_RESOURCE_FILTER: Record<string, ResourceFilterType> = {
  // Admin only - no filter for admins
  MU01: ResourceFilterType.NONE,
  MU02: ResourceFilterType.NONE,
  MU03: ResourceFilterType.NONE,
  MU04: ResourceFilterType.CUSTOMER, // Self-service - filter to own profile
  MF01: ResourceFilterType.NONE,

  // Store Management - filter by store/seller
  SM01: ResourceFilterType.STORE,
  SM02: ResourceFilterType.STORE,
  SM03: ResourceFilterType.STORE,
  SM04: ResourceFilterType.STORE,
  SM05: ResourceFilterType.STORE,
  SM06: ResourceFilterType.STORE_OR_CUSTOMER,
  SM08: ResourceFilterType.STORE_OR_CUSTOMER,
  SM09: ResourceFilterType.STORE,
  SM10: ResourceFilterType.STORE,
  SM11: ResourceFilterType.STORE,
  SM12: ResourceFilterType.STORE,
  SM13: ResourceFilterType.STORE,
  SM14: ResourceFilterType.STORE,
  SM15: ResourceFilterType.STORE,

  // Admin Content
  AC01: ResourceFilterType.NONE, // Global categories
  AC02: ResourceFilterType.STORE,
  AC03: ResourceFilterType.STORE_OR_CUSTOMER,
  AC04: ResourceFilterType.NONE,
  AC05: ResourceFilterType.NONE,
  AC06: ResourceFilterType.NONE,
  AC07: ResourceFilterType.NONE,
  AC08: ResourceFilterType.NONE,
  AC09: ResourceFilterType.NONE,
  AC10: ResourceFilterType.NONE,
  AC11: ResourceFilterType.NONE,
  AP04: ResourceFilterType.NONE,
};

// Cache configuration
export const PERMISSION_CACHE_CONFIG = {
  TTL: 300, // 5 minutes in seconds
  PREFIX: 'user_permissions:',
};
