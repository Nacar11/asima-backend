import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '@/permissions/permissions.decorator';
import { TimeCorrectionRequestsController } from './time-correction-requests.controller';

/**
 * The approver-facing controller is JWT-only at the route: the
 * `PermissionsGuard` can't express "ViewOwn OR is-L1 OR is-L2 OR ViewAll OR
 * system_admin", so authorization lives in the service (`findByIdForViewer`
 * for reads, `canActOn` for approve/reject). A route-level `@Permissions`
 * gate here would reject a chain approver whose role lacks the employee-level
 * code *before* the service check runs — which is exactly the 403 it caused
 * for an L1 approver on an Operations-Manager-style role.
 */
describe('TimeCorrectionRequestsController — route gating', () => {
  const reflector = new Reflector();
  const meta = (fn: (...args: never[]) => unknown) => reflector.get(PERMISSIONS_KEY, fn);

  it('getOne carries no route permission gate (findByIdForViewer authorizes)', () => {
    expect(meta(TimeCorrectionRequestsController.prototype.getOne)).toBeUndefined();
  });

  it('approve and reject are likewise JWT-only at the route', () => {
    expect(meta(TimeCorrectionRequestsController.prototype.approve)).toBeUndefined();
    expect(meta(TimeCorrectionRequestsController.prototype.reject)).toBeUndefined();
  });
});
