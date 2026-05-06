import { ApiProperty } from '@nestjs/swagger';

export class MembershipPlan {
  @ApiProperty({ type: Number, example: 1 })
  id: number;

  @ApiProperty({ type: String, example: 'basic' })
  plan_code: string;

  @ApiProperty({ type: String, example: 'Basic Plan' })
  plan_name: string;

  @ApiProperty({ type: Boolean, example: true })
  is_active: boolean;
}
