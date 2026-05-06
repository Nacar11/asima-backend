import { ApiProperty } from '@nestjs/swagger';
import { User } from '@/users/domain/user';
import { Division } from '@/divisions/domain/division';
import { Department } from '@/departments/domain/department';
import { Section } from '@/sections/domain/section';
import { SubSection } from '@/sub-sections/domain/sub-section';
import { Exclude } from 'class-transformer';
import { Causer } from '@/utils/domain/causer';
import { StatusEnum } from '@/utils/enums/status-enum';

/**
 * Cost Center Domain Entity
 *
 * Represents a cost center in the organizational hierarchy with complete
 * related entity data including division, department, section, and sub-section
 * information, along with user audit trails.
 *
 * Cost centers are used for financial tracking and organizational structure
 * management, providing a hierarchical view of the company's cost structure.
 *
 * @example
 * ```typescript
 * const costCenter = new CostCenter();
 * costCenter.id = 1;
 * costCenter.cost_center_code = '01010101';
 * costCenter.division = { id: 1, division_code: '01', division_name: 'CODY' };
 * costCenter.department = { id: 1, department_code: '01', department_name: 'Operation' };
 * ```
 *
 * @author Cody Inc Development Team
 * @since 1.0.0
 */
export class CostCenter {
  @ApiProperty({
    type: Number,
    example: 1,
  })
  id: number;

  @ApiProperty({
    type: String,
    example: '01010101',
  })
  cost_center_code: string;

  @ApiProperty({
    type: String,
    example: '01010101 / Backend',
  })
  cost_center_name?: string;

  @ApiProperty({
    type: () => Division,
    example: { id: 1, division_code: '01', division_name: 'CODY' },
  })
  division: Pick<Division, 'id' | 'division_code' | 'division_name'> | null;

  @ApiProperty({
    type: () => Department,
    example: { id: 1, department_code: '01', department_name: 'Operation' },
  })
  department: Pick<
    Department,
    'id' | 'department_code' | 'department_name'
  > | null;

  @ApiProperty({
    type: () => Section,
    example: { id: 1, section_code: '01', section_name: 'SD1' },
  })
  section: Pick<Section, 'id' | 'section_code' | 'section_name'> | null;

  @ApiProperty({
    type: () => SubSection,
    example: { id: 1, sub_section_code: '01', sub_section_name: 'Backend' },
  })
  sub_section: Pick<
    SubSection,
    'id' | 'sub_section_code' | 'sub_section_name'
  > | null;

  @ApiProperty({
    type: String,
    example: 'To be used by SD1 Backend Engineers',
  })
  remarks: string | null;

  @ApiProperty({
    type: String,
    nullable: false,
    example: StatusEnum.ACTIVE,
  })
  status: string;

  @ApiProperty({
    type: () => User,
    nullable: false,
    example: { id: 1, first_name: 'John', last_name: 'Doe' },
  })
  created_by: Causer;

  @ApiProperty()
  created_at: Date;

  @ApiProperty({
    type: () => User,
    nullable: false,
    example: { id: 1, first_name: 'John', last_name: 'Doe' },
  })
  updated_by: Causer;

  @ApiProperty()
  updated_at: Date;

  @ApiProperty({
    type: () => User,
    nullable: true,
    example: null,
  })
  deleted_by?: Causer | null;

  @ApiProperty({
    example: null,
  })
  deleted_at?: Date | null;

  @Exclude()
  __entity?: string;
}
