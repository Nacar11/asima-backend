import { GUARDS_METADATA } from '@nestjs/common/constants';
import { SubscriptionsController } from '@/subscriptions/subscriptions.controller';
import { SystemAdminGuard } from '@/users/user.guard';

describe('SubscriptionsController metadata', () => {
  it.each(['findAll', 'update', 'activate', 'suspend', 'bulkDelete', 'remove'])(
    'should keep %s behind system-admin protections',
    (methodName) => {
      const method = Reflect.getOwnPropertyDescriptor(
        SubscriptionsController.prototype,
        methodName,
      )?.value as object;
      const guards = Reflect.getMetadata(GUARDS_METADATA, method) ?? [];

      expect(Reflect.getMetadata('system_admin', method)).toBe(true);
      expect(guards).toContain(SystemAdminGuard);
    },
  );
});
