import { Session } from '@/session/domain/session';
import { User } from '@/users/domain/user';

export type JwtPayloadType = Pick<User, 'id' | 'system_admin'> & {
  sessionId: Session['id'];
  seller_id?: number | null;
  is_store_owner?: boolean | null;
  iat: number;
  exp: number;
  system_admin: boolean;
};
