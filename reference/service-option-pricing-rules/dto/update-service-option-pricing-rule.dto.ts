import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateServiceOptionPricingRuleDto } from './create-service-option-pricing-rule.dto';

export class UpdateServiceOptionPricingRuleDto extends PartialType(
  OmitType(CreateServiceOptionPricingRuleDto, ['service_id'] as const),
) {}
