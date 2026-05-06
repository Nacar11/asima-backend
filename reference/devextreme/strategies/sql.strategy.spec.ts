import { SqlStrategy } from '@/devextreme/strategies/sql.strategy';

const sqlStrategy = new SqlStrategy();

describe('Dev Extreme SQL Strategy', () => {
  describe('Can Build Condition', () => {
    it('should build equal condition', () => {
      expect(sqlStrategy.buildCondition(['status', '=', 'Endorsed'])).toEqual(
        `status = 'Endorsed'`,
      );
    });

    it('should build greater than condition', () => {
      expect(sqlStrategy.buildCondition(['status', '>', 'Endorsed'])).toEqual(
        `status > 'Endorsed'`,
      );
    });

    it('should build less than condition', () => {
      const operator = '<';

      expect(
        sqlStrategy.buildCondition(['status', operator, 'Endorsed']),
      ).toEqual(`status ${operator} 'Endorsed'`);
    });

    it('should build not equal condition', () => {
      const operator = '<>';

      expect(
        sqlStrategy.buildCondition(['status', operator, 'Endorsed']),
      ).toEqual(`status ${operator} 'Endorsed'`);
    });

    it('should build less than or equal condition', () => {
      const operator = '<=';

      expect(
        sqlStrategy.buildCondition(['status', operator, 'Endorsed']),
      ).toEqual(`status ${operator} 'Endorsed'`);
    });

    it('should build less than condition', () => {
      const operator = '>=';

      expect(
        sqlStrategy.buildCondition(['status', operator, 'Endorsed']),
      ).toEqual(`status ${operator} 'Endorsed'`);
    });

    it('should build contains condition', () => {
      expect(
        sqlStrategy.buildCondition(['status', 'contains', 'Endorsed']),
      ).toEqual(`status ILIKE '%Endorsed%'`);
    });

    it('should build not contains condition', () => {
      expect(
        sqlStrategy.buildCondition(['status', 'notcontains', 'Endorsed']),
      ).toEqual(`status NOT ILIKE '%Endorsed%'`);
    });

    it('should build start with condition', () => {
      expect(
        sqlStrategy.buildCondition(['status', 'startswith', 'Endorsed']),
      ).toEqual(`status ILIKE '%Endorsed'`);
    });

    it('should build end with condition', () => {
      expect(
        sqlStrategy.buildCondition(['status', 'endswith', 'Endorsed']),
      ).toEqual(`status ILIKE 'Endorsed%'`);
    });
  });
  describe('Can Build Where Condition', () => {
    it('should build single filter where', () => {
      expect(sqlStrategy.buildCondition(['id', '=', '1'])).toEqual(`id = '1'`);
    });

    it('should build multi filter where', () => {
      expect(
        sqlStrategy.buildWhereCondition([
          ['status', '=', 'Endorsed'],
          'and',
          ['cost_center_id', '=', 'CC005'],
        ]),
      ).toBe(`status = 'Endorsed' and cost_center_id = 'CC005'`);
    });

    it('should build recursive filter where', () => {
      expect(
        sqlStrategy.buildWhereCondition([
          [
            ['control_no', 'contains', 'carlo'],
            'or',
            ['cost_center.cost_center_name', 'contains', 'carlo'],
            'or',
            ['created_by', 'contains', 'carlo'],
            'or',
            ['remarks', 'contains', 'carlo'],
          ],
          'and',
          [
            ['status', '=', 'Endorsed'],
            'and',
            ['cost_center_id', '=', 'CC005'],
          ],
        ]),
      ).toBe(
        `(control_no ILIKE '%carlo%' or cost_center.cost_center_name ILIKE '%carlo%' or created_by ILIKE '%carlo%' or remarks ILIKE '%carlo%') and (status = 'Endorsed' and cost_center_id = 'CC005')`,
      );
    });
  });
});
