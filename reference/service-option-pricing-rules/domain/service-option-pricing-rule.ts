import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ServiceOptionPricingRuleCondition {
  @ApiProperty({ type: Number })
  id: number;

  @ApiProperty({ type: Number })
  option_group_id: number;

  @ApiProperty({ type: Number })
  option_value_id: number;

  @ApiPropertyOptional({ type: String, nullable: true })
  option_group_name?: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  option_value_label?: string | null;
}

export class ServiceOptionPricingRule {
  @ApiProperty({ type: Number })
  id: number;

  @ApiProperty({ type: Number })
  service_id: number;

  @ApiProperty({ type: String })
  name: string;

  @ApiProperty({ type: String })
  code: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  description?: string | null;

  @ApiProperty({ type: Number })
  price_adjustment: number;

  @ApiProperty({ type: Number })
  duration_adjustment_minutes: number;

  @ApiProperty({ type: Number })
  priority: number;

  @ApiProperty({ type: Boolean })
  is_active: boolean;

  @ApiPropertyOptional({ type: Number, nullable: true })
  created_by?: number | null;

  @ApiProperty({ type: Date })
  created_at: Date;

  @ApiPropertyOptional({ type: Number, nullable: true })
  updated_by?: number | null;

  @ApiProperty({ type: Date })
  updated_at: Date;

  @ApiPropertyOptional({ type: Number, nullable: true })
  deleted_by?: number | null;

  @ApiPropertyOptional({ type: Date, nullable: true })
  deleted_at?: Date | null;

  @ApiProperty({ type: () => [ServiceOptionPricingRuleCondition] })
  conditions: ServiceOptionPricingRuleCondition[];
}

export interface EvaluateServiceOptionPricingInput {
  serviceId: number;
  selections: Array<{
    option_group_id: number;
    option_value_id: number;
  }>;
}

export interface EvaluatedServiceOptionPricingResult {
  matched_rule_id: number | null;
  matched_rule_code: string | null;
  price_adjustment: number;
  duration_adjustment_minutes: number;
}
