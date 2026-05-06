import { User } from '@/users/domain/user';

export type Causer = Pick<User, 'id' | 'first_name' | 'last_name'>;
