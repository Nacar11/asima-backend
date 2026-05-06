import { GUARDS_METADATA } from '@nestjs/common/constants';
import { SubscriptionPaymentsController } from '@/subscription-payments/subscription-payments.controller';
import { SystemAdminGuard } from '@/users/user.guard';

describe('SubscriptionPaymentsController metadata', () => {
  it.each([
    'create',
    'findAll',
    'processPayment',
    'markAsFailed',
    'refund',
    'remove',
  ])('should keep %s behind system-admin protections', (methodName) => {
    const method = Reflect.getOwnPropertyDescriptor(
      SubscriptionPaymentsController.prototype,
      methodName,
    )?.value as object;
    const guards = Reflect.getMetadata(GUARDS_METADATA, method) ?? [];

    expect(Reflect.getMetadata('system_admin', method)).toBe(true);
    expect(guards).toContain(SystemAdminGuard);
  });
});
