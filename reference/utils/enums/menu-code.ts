/**
 * List of menu_codes enums that will be use for the application
 * NOTE: If there's a new menu_code, add it here
 */

export enum ProcurementEnum {
  // Request for Quotation
  PQ01 = 'PQ01',

  // Supplier Evaluation
  PE01 = 'PE01',

  // Purchase Request
  PR01 = 'PR01',

  // Purchase Order
  PO01 = 'PO01',

  // Supplier Invoice/Delivery Receipt
  PI01 = 'PI01',
}

export enum InventoryEnum {
  // Receiving
  GR01 = 'GR01',

  // Goods Transfers
  GT01 = 'GT01',

  // Goods Issuances
  GI01 = 'GI01',

  // Inventory
  GM01 = 'GM01',
}

export enum SalesEnum {
  // Sales Order
  SO01 = 'SO01',

  // Delivery Order
  SD01 = 'SD01',

  // Sales Invoicing
  SI01 = 'SI01',
}

export enum ProductionMFQAndQAEnum {
  // Job Order
  PD01 = 'PD01',

  // Travelog
  PDT1 = 'PDT1',
  PDT2 = 'PDT2',
  PDT3 = 'PDT3',
  PDT4 = 'PDT4',
  PDT5 = 'PDT5',
  PDT6 = 'PDT6',

  // Defect
  PDM1 = 'PDM1',

  // Machine
  PDM2 = 'PDM2',

  // Downtime
  PDM3 = 'PDM3',

  // Cost Center Defect
  PDM4 = 'PDM4',

  // Cost Center Machine
  PDM5 = 'PDM5',

  // CostCenter Downtime
  PDM6 = 'PDM6',

  // BOM
  PDM7 = 'PDM7',

  // Product Route
  PDM8 = 'PDM8',
}

export enum ProductionPlanningAndMRP {
  // Production Plan
  PL01 = 'PL01',
  // MRP
  PL02 = 'PL02',
  // Planning master
  PL03 = 'PL03',
  // Plan type
  PL04 = 'PL04',
}

export enum CommonMasterEnum {
  // System Menu
  MS01 = 'MS01',

  // System Control
  MS02 = 'MS02',

  // System Announcements
  MS03 = 'MS03',

  // System Calendar
  MS04 = 'MS04',

  // System Parameters
  MS05 = 'MS05',

  // System Document Control
  MS06 = 'MS06',

  // System Document Signatory
  MS07 = 'MS07',

  // User
  MU01 = 'MU01',

  // User Group
  MU02 = 'MU02',

  // User Access
  MU03 = 'MU03',

  // My Profile (Customer self-service)
  MU04 = 'MU04',

  // Cost Center
  MC01 = 'MC01',

  // Division
  MC02 = 'MC02',

  // Department
  MC03 = 'MC03',

  // Section
  MC04 = 'MC04',

  // Sub Section
  MC05 = 'MC05',

  // Process
  MC06 = 'MC06',

  // Sub Process
  MC07 = 'MC07',

  // Materials
  MM01 = 'MM01',

  // Material Type
  MM02 = 'MM02',

  // Stock Control
  MM03 = 'MM03',

  // Part Number
  MM04 = 'MM04',

  // Unit of Measure
  MM05 = 'MM05',

  // Partners
  MP01 = 'MP01',

  // Price
  MP02 = 'MP02',

  // Currency
  MP03 = 'MP03',

  // Forex
  MP04 = 'MP04',

  // Terms and Condition
  MP05 = 'MP05',

  // Attachments
  MT01 = 'MT01',

  // Vehicle
  MV01 = 'MV01',

  // Delivery Schedule
  MD01 = 'MD01',

  // Employee
  ME01 = 'ME01',

  // Employee Certifications
  ME02 = 'ME02',

  // Incident Reports
  ME03 = 'ME03',

  // Location
  ML01 = 'ML01',

  // Warehouse
  ML02 = 'ML02',

  // Warehouse Stock Type
  ML03 = 'ML03',

  // Requisition Type
  MR01 = 'MR01',

  // Account
  MA01 = 'MA01',

  // Tax Category
  MA02 = 'MA02',

  // Bank
  MA03 = 'MA03',
}

export enum LMSEnum {
  // Resource Library
  LL01 = 'LL01',

  // Assessment
  LA01 = 'LA01',

  // My Assessment
  LA02 = 'LA02',
}

export enum StoreManagementEnum {
  // Products
  SM01 = 'SM01',

  // Categories
  SM02 = 'SM02',

  // Tags
  SM03 = 'SM03',

  // Attributes
  SM04 = 'SM04',

  // Store Settings
  SM05 = 'SM05',

  // Sales Orders
  SM06 = 'SM06',

  // Sales Returns
  SM08 = 'SM08',

  // Sales Report
  SM09 = 'SM09',

  // Services
  SM10 = 'SM10',

  // Service Categories
  SM11 = 'SM11',

  // Service Areas
  SM12 = 'SM12',

  // Materials
  SM13 = 'SM13',

  // Agenda
  SM14 = 'SM14',

  // Detailed Report
  SM15 = 'SM15',
}

export enum AdminContentEnum {
  // Categories (Global)
  AC01 = 'AC01',

  // Media (Sellers)
  AC02 = 'AC02',

  // Reviews
  AC03 = 'AC03',

  // Service Categories (Global)
  AC04 = 'AC04',

  // Services (Global)
  AC05 = 'AC05',

  // Service Areas (Global)
  AC06 = 'AC06',

  // Bookings
  AC07 = 'AC07',

  // Merchants
  AC08 = 'AC08',

  // Vouchers (Global)
  AC09 = 'AC09',

  // Membership Voucher Configurations (Global)
  AC10 = 'AC10',

  // Membership Plans
  AC11 = 'AC11',

  // Content Moderation
  AP04 = 'AP04',
}
