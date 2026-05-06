import { OptionGroupInputTypeEnum } from '../enums/option-group-input-type.enum';
import { OptionGroupStatusEnum } from '../enums/option-group-status.enum';
import { ServiceOptionValue } from '@/service-option-values/domain/service-option-value';

export class ServiceOptionGroup {
  id: number;
  service_id: number;
  name: string;
  code: string;
  description: string | null;
  input_type: OptionGroupInputTypeEnum;
  min_value: number | null;
  max_value: number | null;
  default_value: number | null;
  display_order: number;
  is_required: boolean;
  status: OptionGroupStatusEnum;
  option_values?: ServiceOptionValue[];
  created_by: number | null;
  created_at: Date;
  updated_by: number | null;
  updated_at: Date;
  deleted_by?: number | null;
  deleted_at?: Date | null;
}
