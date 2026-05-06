import {
  transformSkipTakeParams,
  paginate,
} from '@/devextreme/helpers/paginate.helper';
import { IPaginatedResult } from '@/utils/types/paginated-result';

describe('transformSkipTakeParams', () => {
  it('should handle default parameters (skip=0, take=50)', () => {
    const result = transformSkipTakeParams();
    expect(result).toEqual({ page: 1, limit: 50 });
  });

  it('should convert first page correctly (skip=0)', () => {
    const result = transformSkipTakeParams(0, 10);
    expect(result).toEqual({ page: 1, limit: 10 });
  });

  it('should convert second page correctly', () => {
    const result = transformSkipTakeParams(10, 10);
    expect(result).toEqual({ page: 2, limit: 10 });
  });

  it('should convert third page correctly', () => {
    const result = transformSkipTakeParams(20, 10);
    expect(result).toEqual({ page: 3, limit: 10 });
  });

  it('should handle partial page scenarios', () => {
    // Skip 15 items with page size 10 should still be page 2
    const result = transformSkipTakeParams(15, 10);
    expect(result).toEqual({ page: 2, limit: 10 });
  });

  it('should handle large skip values', () => {
    const result = transformSkipTakeParams(500, 25);
    expect(result).toEqual({ page: 21, limit: 25 });
  });

  it('should cap take at 50', () => {
    const result = transformSkipTakeParams(0, 100);
    expect(result).toEqual({ page: 1, limit: 50 });
  });

  it('should cap take at 50 with non-zero skip', () => {
    const result = transformSkipTakeParams(150, 75);
    expect(result).toEqual({ page: 4, limit: 50 });
  });

  it('should handle negative skip values by normalizing to 0', () => {
    const result = transformSkipTakeParams(-10, 20);
    expect(result).toEqual({ page: 1, limit: 20 });
  });

  it('should handle zero take by normalizing to 1', () => {
    const result = transformSkipTakeParams(0, 0);
    expect(result).toEqual({ page: 1, limit: 1 });
  });

  it('should handle negative take by normalizing to 1', () => {
    const result = transformSkipTakeParams(0, -5);
    expect(result).toEqual({ page: 1, limit: 1 });
  });

  it('should handle edge case with take=1', () => {
    const result = transformSkipTakeParams(5, 1);
    expect(result).toEqual({ page: 6, limit: 1 });
  });

  it('should handle typical DevExtreme pagination scenarios', () => {
    // Scenario 1: First page of 20 items
    expect(transformSkipTakeParams(0, 20)).toEqual({ page: 1, limit: 20 });

    // Scenario 2: Second page of 20 items
    expect(transformSkipTakeParams(20, 20)).toEqual({ page: 2, limit: 20 });

    // Scenario 3: Fifth page of 15 items
    expect(transformSkipTakeParams(60, 15)).toEqual({ page: 5, limit: 15 });

    // Scenario 4: Default DevExtreme page size (often 20)
    expect(transformSkipTakeParams(40, 20)).toEqual({ page: 3, limit: 20 });
  });

  it('should maintain consistency with page calculation formula', () => {
    const testCases = [
      { skip: 0, take: 10, expectedPage: 1 },
      { skip: 10, take: 10, expectedPage: 2 },
      { skip: 25, take: 10, expectedPage: 3 }, // 25/10 = 2.5, floor(2.5) + 1 = 3
      { skip: 30, take: 10, expectedPage: 4 }, // 30/10 = 3, floor(3) + 1 = 4
      { skip: 99, take: 25, expectedPage: 4 }, // 99/25 = 3.96, floor(3.96) + 1 = 4
      { skip: 100, take: 25, expectedPage: 5 }, // 100/25 = 4, floor(4) + 1 = 5
    ];

    testCases.forEach(({ skip, take, expectedPage }) => {
      const result = transformSkipTakeParams(skip, take);
      expect(result.page).toBe(expectedPage);
      expect(result.limit).toBe(take);
    });
  });
});

describe('paginate', () => {
  it('should convert IPaginatedResult to DevExtreme format', () => {
    const input: IPaginatedResult<{ id: number; name: string }> = {
      data: [
        { id: 1, name: 'Item 1' },
        { id: 2, name: 'Item 2' },
        { id: 3, name: 'Item 3' },
      ],
      totalResults: 100,
    };

    const result = paginate(input);

    expect(result).toEqual({
      data: [
        { id: 1, name: 'Item 1' },
        { id: 2, name: 'Item 2' },
        { id: 3, name: 'Item 3' },
      ],
      totalCount: 100,
    });
  });

  it('should handle empty data array', () => {
    const input: IPaginatedResult<any> = {
      data: [],
      totalResults: 0,
    };

    const result = paginate(input);

    expect(result).toEqual({
      data: [],
      totalCount: 0,
    });
  });

  it('should handle data with totalResults greater than data length', () => {
    const input: IPaginatedResult<{ id: number }> = {
      data: [{ id: 1 }, { id: 2 }],
      totalResults: 50,
    };

    const result = paginate(input);

    expect(result).toEqual({
      data: [{ id: 1 }, { id: 2 }],
      totalCount: 50,
    });
  });

  it('should preserve data types correctly', () => {
    interface TestItem {
      id: number;
      name: string;
      active: boolean;
      createdAt: Date;
    }

    const testDate = new Date('2024-01-01');
    const input: IPaginatedResult<TestItem> = {
      data: [
        {
          id: 1,
          name: 'Test Item',
          active: true,
          createdAt: testDate,
        },
      ],
      totalResults: 1,
    };

    const result = paginate(input);

    expect(result.data[0].id).toBe(1);
    expect(result.data[0].name).toBe('Test Item');
    expect(result.data[0].active).toBe(true);
    expect(result.data[0].createdAt).toBe(testDate);
    expect(result.totalCount).toBe(1);
  });

  it('should handle large datasets', () => {
    const largeData = Array.from({ length: 50 }, (_, i) => ({
      id: i + 1,
      value: `Item ${i + 1}`,
    }));

    const input: IPaginatedResult<{ id: number; value: string }> = {
      data: largeData,
      totalResults: 10000,
    };

    const result = paginate(input);

    expect(result.data).toHaveLength(50);
    expect(result.data[0]).toEqual({ id: 1, value: 'Item 1' });
    expect(result.data[49]).toEqual({ id: 50, value: 'Item 50' });
    expect(result.totalCount).toBe(10000);
  });
});
