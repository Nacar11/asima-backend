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
  ApiOkResponse,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { CurrenciesService } from '@/currencies/currencies.service';
import { CreateCurrencyDto } from '@/currencies/dto/create-currency.dto';
import { UpdateCurrencyDto } from '@/currencies/dto/update-currency.dto';
import { Currency } from '@/currencies/domain/currency';
import { CurrentUser } from '@/utils/decorators/current-user.decorator';
import { User } from '@/users/domain/user';
import { FindAllCurrenciesDto } from '@/currencies/dto/find-all-currencies.dto';

@ApiTags('Currencies')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller({
  path: 'currencies',
  version: '1',
})
export class CurrenciesController {
  constructor(private readonly currenciesService: CurrenciesService) {}

  @Post()
  @ApiCreatedResponse({ type: Currency })
  create(
    @Body() createCurrencyDto: CreateCurrencyDto,
    @CurrentUser() currentUser: User,
  ) {
    return this.currenciesService.create(createCurrencyDto, currentUser);
  }

  @Get()
  @ApiOkResponse({
    type: Currency,
    isArray: true,
  })
  async findAll(@Query() query: FindAllCurrenciesDto) {
    const { data, totalCount } = await this.currenciesService.findAll(query);
    return { data, totalCount };
  }

  @Get(':id')
  @ApiParam({ name: 'id', type: Number, required: true })
  @ApiOkResponse({ type: Currency })
  findOne(@Param('id') id: number) {
    return this.currenciesService.findById(id);
  }

  @Patch(':id')
  @ApiParam({ name: 'id', type: Number, required: true })
  @ApiOkResponse({ type: Currency })
  update(
    @Param('id') id: number,
    @Body() updateCurrencyDto: UpdateCurrencyDto,
    @CurrentUser() currentUser: User,
  ) {
    return this.currenciesService.update(id, updateCurrencyDto, currentUser);
  }

  @Delete(':id')
  @ApiParam({ name: 'id', type: Number, required: true })
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: number, @CurrentUser() currentUser: User) {
    return this.currenciesService.remove(id, currentUser);
  }
}
