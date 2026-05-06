export type TSeedMenuCode = {
  code: string;
  name: string;
};

export const procurement_codes: TSeedMenuCode[] = [
  { code: 'PQ01', name: 'Request for Quotation' },
  { code: 'PE01', name: 'Supplier Evaluation' },
  { code: 'PR01', name: 'Purchase Request' },
  { code: 'PO01', name: 'Purchase Order' },
  { code: 'PI01', name: 'Supplier Invoice/Delivery Receipt' },
];

export const goods_warehouse_inventory_codes: TSeedMenuCode[] = [
  { code: 'GR01', name: 'Receiving' },
  { code: 'GT01', name: 'Goods Transfers' },
  { code: 'GI01', name: 'Goods Issuances' },
  { code: 'GM01', name: 'Inventory' },
];

export const sales_codes: TSeedMenuCode[] = [
  { code: 'SO01', name: 'Sales Order' },
  { code: 'SD01', name: 'Delivery Order' },
  { code: 'SI01', name: 'Sales Invoicing' },
];

export const production_mfg_codes: TSeedMenuCode[] = [
  { code: 'PD01', name: 'Job Order' },
  { code: 'PDT1', name: 'Travelog Items' },
  { code: 'PDT2', name: 'Travelog Material' },
  { code: 'PDT3', name: 'Travelog Manpower' },
  { code: 'PDT4', name: 'Travelog Machine' },
  { code: 'PDT5', name: 'Travelog Defects' },
  { code: 'PDT6', name: 'Travelog Downtime' },
  { code: 'PDM1', name: 'Defect' },
  { code: 'PDM2', name: 'Machine' },
  { code: 'PDM3', name: 'Downtime' },
  { code: 'PDM4', name: 'Cost Center Defect' },
  { code: 'PDM5', name: 'Cost Center Machine' },
  { code: 'PDM6', name: 'CostCenter Downtime' },
  { code: 'PDM7', name: 'BOM' },
  { code: 'PDM8', name: 'Product Route' },
];

export const production_planning_codes: TSeedMenuCode[] = [
  { code: 'PL01', name: 'Production Plan' },
  { code: 'PL02', name: 'MRP' },
  { code: 'PL03', name: 'Planning master' },
  { code: 'PL04', name: 'Plan type' },
];

export const mobile_master_codes: TSeedMenuCode[] = [
  { code: 'MB01', name: 'LOCATION ASSIGNMENT' },
  { code: 'MB02', name: 'STOCK TRANSFER' },
  { code: 'MB03', name: 'PICKING & ISSUANCE' },
  { code: 'MB04', name: 'INVENTORY COUNTING' },
  { code: 'MB05', name: 'DELIVERY LOADING' },
];

export const common_master_codes: TSeedMenuCode[] = [
  { code: 'MS01', name: 'System Menu' },
  { code: 'MS02', name: 'System Control' },
  { code: 'MS03', name: 'System Announcements' },
  { code: 'MS04', name: 'System Calendar' },
  { code: 'MS05', name: 'System Parameters' },
  { code: 'MS06', name: 'System Document Control' },
  { code: 'MS07', name: 'System Document Signatory' },
  { code: 'MU01', name: 'User' },
  { code: 'MU02', name: 'User Group' },
  { code: 'MU03', name: 'User Access' },
  { code: 'MF01', name: 'Franchises' },
  { code: 'MC01', name: 'Cost Center' },
  { code: 'MC02', name: 'Division' },
  { code: 'MC03', name: 'Department' },
  { code: 'MC04', name: 'Section' },
  { code: 'MC05', name: 'Sub Section' },
  { code: 'MC06', name: 'Process' },
  { code: 'MC07', name: 'Sub Process' },
  { code: 'MM01', name: 'Materials' },
  { code: 'MM02', name: 'Material Type' },
  { code: 'MM03', name: 'Stock Control' },
  { code: 'MM04', name: 'Part Number' },
  { code: 'MM05', name: 'Unit of Measure' },
  { code: 'MP01', name: 'Partners' },
  { code: 'MP02', name: 'Price' },
  { code: 'MP03', name: 'Currency' },
  { code: 'MP04', name: 'Forex' },
  { code: 'MP05', name: 'Terms and Condition' },
  { code: 'MT01', name: 'Attachments' },
  { code: 'MV01', name: 'Vehicle' },
  { code: 'MD01', name: 'Delivery Schedule' },
  { code: 'ME01', name: 'Employee' },
  { code: 'ME02', name: 'Employee Certifications' },
  { code: 'ME03', name: 'Incident Reports' },
  { code: 'ML01', name: 'Location' },
  { code: 'ML02', name: 'Warehouse' },
  { code: 'ML03', name: 'Warehouse Stock Type' },
  { code: 'MR01', name: 'Requisition Type' },
  { code: 'MA01', name: 'Account' },
  { code: 'MA02', name: 'Tax Category' },
  { code: 'MA03', name: 'Bank' },
];

// Store Management (Ekumpra) codes
export const store_management_codes: TSeedMenuCode[] = [
  { code: 'SM01', name: 'Products' },
  { code: 'SM02', name: 'Categories' },
  { code: 'SM03', name: 'Tags' },
  { code: 'SM04', name: 'Attributes' },
  { code: 'SM05', name: 'Store Settings' },
  { code: 'SM06', name: 'Sales Orders' },
  { code: 'SM08', name: 'Sales Returns' },
  { code: 'SM09', name: 'Sales Report' },
  { code: 'SM10', name: 'Services' },
  { code: 'SM11', name: 'Service Categories' },
  { code: 'SM12', name: 'Service Areas' },
  { code: 'SM13', name: 'Materials' },
  { code: 'SM14', name: 'Agenda' },
  { code: 'SM15', name: 'Detailed Report' },
  { code: 'SM16', name: 'Service Booking' },
  { code: 'SUG1', name: 'Store User Groups' },
  { code: 'SMB1', name: 'Store Members' },
  { code: 'SV01', name: 'Store Vouchers' },
];

// Admin Content codes
export const admin_content_codes: TSeedMenuCode[] = [
  { code: 'AC01', name: 'Categories (Global)' },
  { code: 'AC02', name: 'Media (Sellers)' },
  { code: 'AC03', name: 'Reviews' },
];

// Admin Global codes
export const admin_global_codes: TSeedMenuCode[] = [
  { code: 'AC04', name: 'Service Categories (Global)' },
  { code: 'AC05', name: 'Services (Global)' },
  { code: 'AC06', name: 'Service Areas (Global)' },
  { code: 'AC07', name: 'Bookings' },
  { code: 'AC08', name: 'Merchants' },
  { code: 'AC09', name: 'Vouchers (Global)' },
  { code: 'AC10', name: 'Membership Voucher Configurations (Global)' },
  { code: 'AC11', name: 'Membership Plans' },
  { code: 'AC12', name: 'Store Settings (Global)' },
];

export const admin_panel_codes: TSeedMenuCode[] = [
  { code: 'AP04', name: 'Content Moderation' },
  { code: 'AP05', name: 'Pickleball Merchant Applications' },
];

// Adtokart User/Master codes (subset of common_master_codes)
export const adtokart_user_codes: TSeedMenuCode[] = [
  { code: 'MU01', name: 'User' },
  { code: 'MU02', name: 'User Group' },
  { code: 'MU03', name: 'User Access' },
  { code: 'MU04', name: 'My Profile' },
  { code: 'MF01', name: 'Franchises' },
];

// Seller Dashboard codes
export const seller_dashboard_codes: TSeedMenuCode[] = [
  { code: 'SW01', name: 'Seller Wallet' },
];

// Admin Wallet codes
export const admin_wallet_codes: TSeedMenuCode[] = [
  { code: 'AW01', name: 'Admin Wallet Management' },
];
