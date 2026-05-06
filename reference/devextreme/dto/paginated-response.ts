import { Type } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';

export class DevExtremePaginatedResponseDto<T> {
  data: T[];
  totalCount: number;
}

export function DevExtremePaginatedResponse<T>(classReference: Type<T>) {
  abstract class Pagination {
    @ApiProperty({ type: [classReference] })
    data!: T[];

    @ApiProperty({
      type: Number,
      example: 10,
      description: 'Total number of entries',
    })
    totalCount!: number;
  }

  Object.defineProperty(Pagination, 'name', {
    writable: false,
    value: `Paginated${classReference.name}ResponseDto`,
  });

  return Pagination;
}
