import { createFieldFilters } from '@/devextreme/helpers/filter-condition.helper';

type FilterCondition = [string, string, string];

describe('createFieldFilters', () => {
  it('should handle a single condition array by wrapping it', async () => {
    const filter: FilterCondition = ['field1', '=', 'value1'];
    const fieldFilters = [{ field: 'field1', relatedFields: [] }];

    const result = await createFieldFilters(filter, fieldFilters);
    expect(result).toEqual([['field1', '=', 'value1']]);
  });

  it('should add related fields with "or" operators based on the provided data', async () => {
    const filter = [
      ['cost_center.cost_center_name', 'contains', 'testtest'],
      'or',
      ['created_by', 'contains', 'testtest'],
    ] as (string | string[])[];
    const fieldFilters = [
      {
        field: 'cost_center.cost_center_name',
        relatedFields: [
          'division.division_name',
          'department.department_name',
          'section.section_name',
          'sub_section.sub_section_name',
        ],
      },
      {
        field: 'created_by',
        relatedFields: [
          'user.first_name',
          'user.last_name',
          'user.middle_name',
        ],
      },
    ];

    const result = await createFieldFilters(filter, fieldFilters);
    expect(result).toEqual([
      [
        ['division.division_name', 'contains', 'testtest'],
        'or',
        ['department.department_name', 'contains', 'testtest'],
        'or',
        ['section.section_name', 'contains', 'testtest'],
        'or',
        ['sub_section.sub_section_name', 'contains', 'testtest'],
      ],
      'or',
      [
        ['user.first_name', 'contains', 'testtest'],
        'or',
        ['user.last_name', 'contains', 'testtest'],
        'or',
        ['user.middle_name', 'contains', 'testtest'],
      ],
    ]);
  });

  it('should map data with recursive', async () => {
    const filter = [
      [
        ['control_no', 'contains', 'testtest'],
        'or',
        ['cost_center.cost_center_name', 'contains', 'testtest'],
        'or',
        ['created_by', 'contains', 'testtest'],
        'or',
        ['remarks', 'contains', 'testtest'],
      ],
      'and',
      [
        ['pr_date', '>=', '2024-12-25T16:00:00.000Z'],
        'and',
        ['pr_date', '<=', '2025-06-25T16:00:00.000Z'],
      ],
    ] as (string | string[])[];
    const fieldFilters = [
      {
        field: 'cost_center.cost_center_name',
        relatedFields: [
          'division.division_name',
          'department.department_name',
          'section.section_name',
          'sub_section.sub_section_name',
        ],
      },
      {
        field: 'created_by',
        relatedFields: [
          'user.first_name',
          'user.last_name',
          'user.middle_name',
        ],
      },
      {
        field: 'remarks',
        relatedFields: ['purchaseRequest.remarks'],
      },
      {
        field: 'id',
        relatedFields: ['purchaseRequest.id'],
      },
    ];

    const result = await createFieldFilters(filter, fieldFilters);
    expect(result).toEqual([
      [
        ['control_no', 'contains', 'testtest'],
        'or',
        [
          ['division.division_name', 'contains', 'testtest'],
          'or',
          ['department.department_name', 'contains', 'testtest'],
          'or',
          ['section.section_name', 'contains', 'testtest'],
          'or',
          ['sub_section.sub_section_name', 'contains', 'testtest'],
        ],
        'or',
        [
          ['user.first_name', 'contains', 'testtest'],
          'or',
          ['user.last_name', 'contains', 'testtest'],
          'or',
          ['user.middle_name', 'contains', 'testtest'],
        ],
        'or',
        [['purchaseRequest.remarks', 'contains', 'testtest']],
      ],
      'and',
      [
        ['pr_date', '>=', '2024-12-25T16:00:00.000Z'],
        'and',
        ['pr_date', '<=', '2025-06-25T16:00:00.000Z'],
      ],
    ]);
  });

  it('should map data with recursive', async () => {
    const filter = [
      [
        ['control_no', 'contains', 'pr test'],
        'or',
        ['cost_center.cost_center_name', 'contains', 'pr test'],
        'or',
        ['created_by', 'contains', 'pr test'],
        'or',
        ['remarks', 'contains', 'pr test'],
      ],
      'and',
      [
        ['status', '=', 'Endorsed'],
        'and',
        [
          ['pr_date', '>=', '2025-03-01T16:00:00.000Z'],
          'and',
          ['pr_date', '<=', '2025-03-03T15:59:59.999Z'],
        ],
      ],
    ] as (string | string[])[];
    const fieldFilters = [
      {
        field: 'cost_center.cost_center_name',
        relatedFields: [
          'division.division_name',
          'department.department_name',
          'section.section_name',
          'sub_section.sub_section_name',
        ],
      },
      {
        field: 'created_by',
        relatedFields: [
          'user.first_name',
          'user.last_name',
          'user.middle_name',
        ],
      },
      {
        field: 'remarks',
        relatedFields: ['purchaseRequest.remarks'],
      },
      {
        field: 'id',
        relatedFields: ['purchaseRequest.id'],
      },
      {
        field: 'status',
        relatedFields: ['purchaseRequest.status'],
      },
    ];

    const result = await createFieldFilters(filter, fieldFilters);
    expect(result).toEqual([
      [
        ['control_no', 'contains', 'pr test'],
        'or',
        [
          ['division.division_name', 'contains', 'pr test'],
          'or',
          ['department.department_name', 'contains', 'pr test'],
          'or',
          ['section.section_name', 'contains', 'pr test'],
          'or',
          ['sub_section.sub_section_name', 'contains', 'pr test'],
        ],
        'or',
        [
          ['user.first_name', 'contains', 'pr test'],
          'or',
          ['user.last_name', 'contains', 'pr test'],
          'or',
          ['user.middle_name', 'contains', 'pr test'],
        ],
        'or',
        [['purchaseRequest.remarks', 'contains', 'pr test']],
      ],
      'and',
      [
        [['purchaseRequest.status', '=', 'Endorsed']],
        'and',
        [
          ['pr_date', '>=', '2025-03-01T16:00:00.000Z'],
          'and',
          ['pr_date', '<=', '2025-03-03T15:59:59.999Z'],
        ],
      ],
    ]);
  });
});
