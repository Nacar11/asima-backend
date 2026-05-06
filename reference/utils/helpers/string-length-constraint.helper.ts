import { MaxLength } from '@/utils/types/string-length-constraint.type';

export function assetMaxLength(
  value: string,
  max_length: number,
): asserts value is MaxLength<typeof value, typeof max_length> {
  if (value.length > max_length)
    throw new Error(
      `String "${value}" exceeds maximum length of 12 characters`,
    );
}
