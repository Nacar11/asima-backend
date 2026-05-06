import { Transform } from 'class-transformer';
import type { SortTransformType } from './devextreme.type';

export function TransformSort() {
  return Transform(({ value }) => {
    if (!value) return value;

    try {
      const parsedValue: SortTransformType[] =
        typeof value === 'string' ? JSON.parse(value) : value;

      return parsedValue.reduce((acc, { selector, desc }) => {
        acc[selector] = desc ? 'DESC' : 'ASC';
        return acc;
      }, {});
    } catch (error) {
      throw new Error(`Invalid sort format: ${error.message}`);
    }
  });
}
