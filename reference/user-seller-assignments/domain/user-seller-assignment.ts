import { Seller } from '@/sellers/domain/seller';
import { User } from '@/users/domain/user';

export class UserSellerAssignment {
  id: number;
  seller_id: number;
  seller?: Seller;
  user_id: number;
  user?: User;
  status: string;
  created_by?: User | null;
  created_at: Date;
  updated_by?: User | null;
  updated_at: Date;
  deleted_by?: User | null;
  deleted_at?: Date | null;
}
