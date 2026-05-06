import { TransformFnParams } from 'class-transformer/types/interfaces';
import { MaybeType } from '@/utils/types/maybe.type';

export const lowerCaseTransformer = (
  params: TransformFnParams,
): MaybeType<string> => params.value?.toLowerCase().trim();
