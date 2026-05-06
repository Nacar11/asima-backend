import type { ISortFilter } from '@/devextreme/devextreme.interface';
import type { SortTransformType } from '@/devextreme/devextreme.type';
import {
  processMultiSortMapping,
  singleSortMap,
} from '@/devextreme/helpers/sort.helper';

describe('singleSortMap', () => {
  it('should map to ISortFilter', () => {
    const sort: SortTransformType = { name: 'asc' };
    const sortTo: ISortFilter = {
      field: 'name',
      relatedFields: ['first_name', 'middle_name', 'last_name'],
    };

    const modifiedSort = singleSortMap(sort, sortTo);

    expect(modifiedSort).toEqual({
      first_name: 'asc',
      middle_name: 'asc',
      last_name: 'asc',
    });
  });
});

describe('processMultiSortMapping', () => {
  it('should map to ISortFilter', () => {
    const sort: SortTransformType = { name: 'asc', address: 'desc' };
    const sortTo: ISortFilter[] = [
      {
        field: 'name',
        relatedFields: ['first_name', 'middle_name', 'last_name'],
      },
      { field: 'address', relatedFields: ['street', 'city', 'state'] },
    ];

    const modifiedSort = processMultiSortMapping(sort, sortTo);

    expect(modifiedSort).toEqual({
      first_name: 'asc',
      middle_name: 'asc',
      last_name: 'asc',
      street: 'desc',
      city: 'desc',
      state: 'desc',
    });
  });
});

describe('Process Combine Sort Mapping', () => {
  it('should map combination of Single to ISortFilter', () => {
    const sort: SortTransformType = { name: 'asc' };
    const sortTo: ISortFilter[] = [
      {
        field: 'name',
        relatedFields: ['first_name', 'middle_name', 'last_name'],
      },
    ];

    const modifiedSort = processMultiSortMapping(sort, sortTo);

    expect(modifiedSort).toEqual({
      first_name: 'asc',
      middle_name: 'asc',
      last_name: 'asc',
    });
  });

  it('should map to ISortFilter', () => {
    const sort: SortTransformType = { name: 'asc', address: 'desc' };
    const sortTo: ISortFilter[] = [
      {
        field: 'name',
        relatedFields: ['first_name', 'middle_name', 'last_name'],
      },
      { field: 'address', relatedFields: ['street', 'city', 'state'] },
    ];

    const modifiedSort = processMultiSortMapping(sort, sortTo);

    expect(modifiedSort).toEqual({
      first_name: 'asc',
      middle_name: 'asc',
      last_name: 'asc',
      street: 'desc',
      city: 'desc',
      state: 'desc',
    });
  });
});
