export class SalesOrderItemAddon {
  id: number;
  sales_order_item_id: number;
  addon_id: number | null;
  addon_name: string;
  addon_code: string;
  addon_description: string | null;
  unit_type: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
  duration_minutes: number | null;
  created_by: number | null;
  created_at: Date;
  updated_by: number | null;
  updated_at: Date;
}
