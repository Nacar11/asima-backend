import { SetMetadata } from '@nestjs/common';

const isPublicKey = 'isPublic';

/**
 * Marks a route handler/controller as public.
 */
export const Public = (): ReturnType<typeof SetMetadata> =>
  SetMetadata(isPublicKey, true);
