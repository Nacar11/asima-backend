import { SetMetadata } from '@nestjs/common';

export const SystemAdmin = (is_system_admin: boolean) =>
  SetMetadata('system_admin', is_system_admin);
