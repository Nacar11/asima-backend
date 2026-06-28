import { toDto, toPaginatedDto } from '@/utils/helpers/assemble';
import { PaginatedResponse } from '@/utils/types/paginated-response.type';

class FooDto {
  a!: number;
  b!: string;
}

describe('assemble helpers', () => {
  describe('toDto', () => {
    it('copies all own fields onto a fresh DTO instance', () => {
      const src = { a: 1, b: 'x' };
      const dto = toDto(FooDto, src);
      expect(dto).toBeInstanceOf(FooDto);
      expect(dto.a).toBe(1);
      expect(dto.b).toBe('x');
    });

    it('copies extra source fields too (records may carry more than the DTO)', () => {
      const src = { a: 1, b: 'x', extra: true };
      const dto = toDto(FooDto, src) as FooDto & { extra: boolean };
      expect(dto.extra).toBe(true);
    });

    it('returns a new instance, not the source', () => {
      const src = { a: 1, b: 'x' };
      expect(toDto(FooDto, src)).not.toBe(src);
    });
  });

  describe('toPaginatedDto', () => {
    it('maps data and preserves the pagination envelope', () => {
      const page: PaginatedResponse<{ a: number; b: string }> = {
        data: [
          { a: 1, b: 'x' },
          { a: 2, b: 'y' },
        ],
        total: 2,
        page: 1,
        limit: 20,
        has_more: false,
      };

      const result = toPaginatedDto(FooDto, page);

      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
      expect(result.has_more).toBe(false);
      expect(result.data).toHaveLength(2);
      expect(result.data[0]).toBeInstanceOf(FooDto);
      expect(result.data[1].b).toBe('y');
    });
  });
});
