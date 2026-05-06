export class SalesOrderItemOption {
  id: number;
  sales_order_item_id: number;
  option_group_id: number | null;
  option_value_id: number | null;
  group_name: string;
  group_code: string;
  value_label: string;
  value_code: string;
  quantity: number;
  price_adjustment: number;
  duration_adjustment_minutes: number;
  created_by: number | null;
  created_at: Date;
  updated_by: number | null;
  updated_at: Date;
}
