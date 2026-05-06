import { MembershipStatusEnum } from '@/memberships/enums/membership-status.enum';

interface MembershipAccessFields {
  status: MembershipStatusEnum;
  grace_ends_at?: Date | null;
}

export function isMembershipAccessGranted(
  membership: MembershipAccessFields | null | undefined,
  now: Date,
): boolean {
  if (!membership) return false;
  if (membership.status === MembershipStatusEnum.EXPIRED) return false;
  if (
    membership.status === MembershipStatusEnum.GRACE_PERIOD &&
    membership.grace_ends_at != null &&
    membership.grace_ends_at < now
  ) {
    return false;
  }
  return true;
}
