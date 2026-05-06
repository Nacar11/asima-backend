import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServicesModule } from '@/services/services.module';
import { ServiceOptionGroupsModule } from '@/service-option-groups/service-option-groups.module';
import { ServiceOptionPricingRulesController } from './service-option-pricing-rules.controller';
import { ServiceOptionPricingRulesService } from './service-option-pricing-rules.service';
import { ServiceOptionPricingRuleEntity } from './persistence/entities/service-option-pricing-rule.entity';
import { ServiceOptionPricingRuleConditionEntity } from './persistence/entities/service-option-pricing-rule-condition.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ServiceOptionPricingRuleEntity,
      ServiceOptionPricingRuleConditionEntity,
    ]),
    ServicesModule,
    ServiceOptionGroupsModule,
  ],
  controllers: [ServiceOptionPricingRulesController],
  providers: [ServiceOptionPricingRulesService],
  exports: [ServiceOptionPricingRulesService],
})
export class ServiceOptionPricingRulesModule {}
