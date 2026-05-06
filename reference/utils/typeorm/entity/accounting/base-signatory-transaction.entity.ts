import { UserEntity } from '@/users/persistence/entities/user.entity';
import { BaseTransactionEntityHelper } from '@/utils/typeorm/entity/accounting/base-transaction.entity';

export abstract class BaseSignatoryTransactionEntityHelper extends BaseTransactionEntityHelper {
  endorsed_by?: UserEntity | null;
  approved_by?: UserEntity | null;
  // disapproved_by?: UserEntity | null; TODO: (basecode) need more discussion on this field
}
