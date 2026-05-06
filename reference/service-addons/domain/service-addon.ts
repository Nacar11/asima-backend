import { AddonStatusEnum } from '../enums/addon-status.enum';
import { ServiceAddonInclusion } from './service-addon-inclusion';

export class ServiceAddon {
  id: number;
  service_id: number;
  name: string;
  code: string;
  description: string | null;
  short_description: string | null;
  unit_type: string | null;
  price: number;
  compare_at_price: number | null;
  duration_minutes: number | null;
  min_quantity: number;
  max_quantity: number;
  display_order: number;
  icon_url: string | null;
  image_url: string | null;
  is_popular: boolean;
  is_required: boolean;
  status: AddonStatusEnum;
  inclusions: ServiceAddonInclusion[];
  created_by: number | null;
  created_at: Date;
  updated_by: number | null;
  updated_at: Date;
  deleted_by?: number | null;
  deleted_at?: Date | null;
}
