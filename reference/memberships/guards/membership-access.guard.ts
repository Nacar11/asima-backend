import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { ClsService } from 'nestjs-cls';
import { BaseMembershipRepository } from '@/memberships/persistence/base-membership.repository';
import { isMembershipAccessGranted } from '@/memberships/utils/membership-access.util';
import { User } from '@/users/domain/user';

@Injectable()
export class MembershipAccessGuard implements CanActivate {
  constructor(
    private readonly cls: ClsService,
    private readonly membershipRepository: BaseMembershipRepository,
  ) {}

  async canActivate(_context: ExecutionContext): Promise<boolean> {
    const user: User | undefined = this.cls.get('currentUser');
    if (!user) throw new ForbiddenException('Authentication required');

    const membership = await this.membershipRepository.findLatestByUserId(
      user.id,
    );
    if (!isMembershipAccessGranted(membership, new Date())) {
      throw new ForbiddenException('Active membership required');
    }
    return true;
  }
}
