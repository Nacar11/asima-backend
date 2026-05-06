import { OptionValueStatusEnum } from '../enums/option-value-status.enum';

export class ServiceOptionValue {
  id: number;
  option_group_id: number;
  label: string;
  value: string;
  description: string | null;
  price_adjustment: number;
  price_multiplier: number;
  duration_adjustment_minutes: number;
  icon_url: string | null;
  display_order: number;
  is_default: boolean;
  status: OptionValueStatusEnum;
  created_at: Date;
  updated_at: Date;
}
