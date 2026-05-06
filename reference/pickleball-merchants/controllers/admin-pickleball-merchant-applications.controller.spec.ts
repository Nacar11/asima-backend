import { GUARDS_METADATA } from '@nestjs/common/constants';
import { AdminPickleballMerchantApplicationsController } from '@/pickleball-merchants/controllers/admin-pickleball-merchant-applications.controller';
import { SystemAdminGuard } from '@/users/user.guard';

describe('AdminPickleballMerchantApplicationsController metadata', () => {
  it('should require system-admin access for every route in the controller', () => {
    const guards =
      Reflect.getMetadata(
        GUARDS_METADATA,
        AdminPickleballMerchantApplicationsController,
      ) ?? [];

    expect(
      Reflect.getMetadata(
        'system_admin',
        AdminPickleballMerchantApplicationsController,
      ),
    ).toBe(true);
    expect(guards).toContain(SystemAdminGuard);
  });
});
