import { UserEntity } from '@/users/persistence/entities/user.entity';
import { BaseTransactionalEntityHelper } from '@/utils/typeorm/entity/base-transactional.entity';

export abstract class BaseSignatoryTransactionalEntityHelper extends BaseTransactionalEntityHelper {
  endorsed_by?: UserEntity | null;

  reviewed_by?: UserEntity | null;

  approved_by?: UserEntity | null;
}
