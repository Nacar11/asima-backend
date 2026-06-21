import { assignApprovers, SeedEmployee } from './chain-assignments';

// admin(1) · HR 2,3 · OPS 4 · PM 5,6,7 · TD 8,9,10,11,12 · EMPLOYEE 13..18
const EMPLOYEES: SeedEmployee[] = [
  { id: 1, role_name: 'SUPER_ADMIN', system_admin: true },
  { id: 2, role_name: 'HR_ADMIN' },
  { id: 3, role_name: 'HR_ADMIN' },
  { id: 4, role_name: 'OPERATIONS_MANAGER' },
  { id: 5, role_name: 'PROJECT_MANAGER' },
  { id: 6, role_name: 'PROJECT_MANAGER' },
  { id: 7, role_name: 'PROJECT_MANAGER' },
  { id: 8, role_name: 'TECHNICAL_DIRECTOR' },
  { id: 9, role_name: 'TECHNICAL_DIRECTOR' },
  { id: 10, role_name: 'TECHNICAL_DIRECTOR' },
  { id: 11, role_name: 'TECHNICAL_DIRECTOR' },
  { id: 12, role_name: 'TECHNICAL_DIRECTOR' },
  { id: 13, role_name: 'EMPLOYEE' },
  { id: 14, role_name: 'EMPLOYEE' },
  { id: 15, role_name: 'EMPLOYEE' },
  { id: 16, role_name: 'EMPLOYEE' },
  { id: 17, role_name: 'EMPLOYEE' },
  { id: 18, role_name: 'EMPLOYEE' },
];

const APPROVER_ROLES = new Set(['PROJECT_MANAGER', 'TECHNICAL_DIRECTOR', 'HR_ADMIN']);
const roleOf = (id: number) => EMPLOYEES.find((e) => e.id === id)!.role_name;

describe('assignApprovers', () => {
  const rows = assignApprovers(EMPLOYEES);
  const byEmployee = (id: number) => rows.filter((r) => r.employee_id === id);

  it('skips the system_admin entirely', () => {
    expect(byEmployee(1)).toHaveLength(0);
  });

  it('gives every non-admin employee a step-1 row', () => {
    for (const e of EMPLOYEES.filter((x) => !x.system_admin)) {
      expect(byEmployee(e.id).some((r) => r.step === 1)).toBe(true);
    }
  });

  it('gives EMPLOYEE and PROJECT_MANAGER a step 2, but not TD/OPS/HR', () => {
    expect(byEmployee(13).some((r) => r.step === 2)).toBe(true); // EMPLOYEE
    expect(byEmployee(5).some((r) => r.step === 2)).toBe(true); // PM
    expect(byEmployee(8).some((r) => r.step === 2)).toBe(false); // TD
    expect(byEmployee(4).some((r) => r.step === 2)).toBe(false); // OPS
    expect(byEmployee(2).some((r) => r.step === 2)).toBe(false); // HR
  });

  it('never assigns an employee as their own approver (DB CHECK)', () => {
    for (const r of rows) expect(r.approver_id).not.toBe(r.employee_id);
  });

  it('only routes to approve-capable roles (PM/TD/HR)', () => {
    for (const r of rows) expect(APPROVER_ROLES.has(roleOf(r.approver_id))).toBe(true);
  });

  it('round-robins L1 so every PM is an approver for some employee', () => {
    const l1Approvers = new Set(rows.filter((r) => r.step === 1).map((r) => r.approver_id));
    for (const pm of [5, 6, 7]) expect(l1Approvers.has(pm)).toBe(true);
  });

  it('routes the two HR admins to each other (no self), single-level', () => {
    expect(byEmployee(2)).toEqual([{ employee_id: 2, step: 1, approver_id: 3 }]);
    expect(byEmployee(3)).toEqual([{ employee_id: 3, step: 1, approver_id: 2 }]);
  });
});
