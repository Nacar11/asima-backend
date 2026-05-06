import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '@/utils/decorators/current-user.decorator';
import { User } from '@/users/domain/user';
import { ServiceOptionPricingRulesService } from './service-option-pricing-rules.service';
import { CreateServiceOptionPricingRuleDto } from './dto/create-service-option-pricing-rule.dto';
import { UpdateServiceOptionPricingRuleDto } from './dto/update-service-option-pricing-rule.dto';
import { QueryServiceOptionPricingRuleDto } from './dto/query-service-option-pricing-rule.dto';
import { ServiceOptionPricingRule } from './domain/service-option-pricing-rule';

@ApiTags('Service Option Pricing Rules')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller({
  path: 'service-option-pricing-rules',
  version: '1',
})
export class ServiceOptionPricingRulesController {
  constructor(private readonly service: ServiceOptionPricingRulesService) {}

  @Post()
  @ApiCreatedResponse({ type: ServiceOptionPricingRule })
  create(
    @Body() dto: CreateServiceOptionPricingRuleDto,
    @CurrentUser() currentUser: User,
  ) {
    return this.service.create(dto, currentUser);
  }

  @Get()
  @ApiOkResponse({ type: ServiceOptionPricingRule, isArray: true })
  async findAll(@Query() query: QueryServiceOptionPricingRuleDto) {
    const { data, totalCount } = await this.service.findAll(query);
    return { data, totalCount };
  }

  @Get('by-service/:serviceId')
  @ApiParam({ name: 'serviceId', type: Number })
  @ApiOkResponse({ type: ServiceOptionPricingRule, isArray: true })
  findByService(@Param('serviceId') serviceId: number) {
    return this.service.findByServiceId(serviceId);
  }

  @Get(':id')
  @ApiParam({ name: 'id', type: Number })
  @ApiOkResponse({ type: ServiceOptionPricingRule })
  findOne(@Param('id') id: number) {
    return this.service.findById(id);
  }

  @Patch(':id')
  @ApiParam({ name: 'id', type: Number })
  @ApiOkResponse({ type: ServiceOptionPricingRule })
  update(
    @Param('id') id: number,
    @Body() dto: UpdateServiceOptionPricingRuleDto,
    @CurrentUser() currentUser: User,
  ) {
    return this.service.update(id, dto, currentUser);
  }

  @Delete(':id')
  @ApiParam({ name: 'id', type: Number })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  remove(@Param('id') id: number, @CurrentUser() currentUser: User) {
    return this.service.remove(id, currentUser);
  }
}
