import { PaginatedResponse } from '@/utils/types/paginated-response.type';

/**
 * Shared response-DTO assembly helpers. Every module assembler maps a pure
 * domain record / read-model onto its `@ApiProperty` response DTO, and the wire
 * mirrors the domain 1:1 (snake_case end-to-end, no translation layer — a
 * project invariant), so the mapping is a faithful structural copy. These three
 * functions home that copy so it isn't re-spelled in every assembler; the e2e
 * suites guard byte-for-byte parity.
 *
 * Loose `src: object` typing matches the prior `Object.assign(new Dto(), src)`
 * call sites exactly — records sometimes carry MORE fields than the DTO (e.g.
 * list items extend records), which a stricter `Partial<T>` would reject.
 */

/** Structural copy of a domain record/read-model onto a fresh response DTO. */
export function toDto<T extends object>(Dto: new () => T, src: object): T {
  return Object.assign(new Dto(), src);
}

/** Map a PaginatedResponse's `data` onto response DTOs, preserving the envelope. */
export function toPaginatedDto<T extends object>(
  Dto: new () => T,
  page: PaginatedResponse<object>,
): PaginatedResponse<T> {
  return { ...page, data: page.data.map((item) => toDto(Dto, item)) };
}
