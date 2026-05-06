import { ApiProperty } from '@nestjs/swagger';
import { Type } from '@nestjs/common';

export class PaginatedResponseDto<T> {
  data: T[];
  totalResults: number;
  totalPages: number;
  currentPage: number;
}

export function PaginatedResponse<T>(classReference: Type<T>) {
  abstract class Pagination {
    @ApiProperty({ type: [classReference] })
    data!: T[];

    @ApiProperty({
      type: Number,
      example: 100,
      description: 'Total number of results available',
    })
    totalResults!: number;

    @ApiProperty({
      type: Number,
      example: 10,
      description: 'Total number of pages available',
    })
    totalPages!: number;

    @ApiProperty({
      type: Number,
      example: 1,
      description: 'Current page number',
    })
    currentPage!: number;
  }

  Object.defineProperty(Pagination, 'name', {
    writable: false,
    value: `Paginated${classReference.name}ResponseDto`,
  });

  return Pagination;
}
