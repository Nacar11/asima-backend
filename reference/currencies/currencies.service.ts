import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BaseCurrencyRepository } from '@/currencies/persistence/base-currency.repository';
import { CreateCurrencyDto } from '@/currencies/dto/create-currency.dto';
import { UpdateCurrencyDto } from '@/currencies/dto/update-currency.dto';
import { FindAllCurrenciesDto } from '@/currencies/dto/find-all-currencies.dto';
import { Currency } from '@/currencies/domain/currency';
import { User } from '@/users/domain/user';

@Injectable()
export class CurrenciesService {
  constructor(private readonly currencyRepository: BaseCurrencyRepository) {}

  async create(
    createCurrencyDto: CreateCurrencyDto,
    causer: User,
  ): Promise<Currency> {
    const existing = await this.currencyRepository.findByCode(
      createCurrencyDto.code,
    );

    if (existing) {
      throw new ConflictException('Currency code already exists');
    }

    return this.currencyRepository.create({
      ...createCurrencyDto,
      exchange_rate_to_php: createCurrencyDto.exchange_rate_to_php ?? 1,
      status: createCurrencyDto.status ?? 'Active',
      created_by: causer,
      updated_by: causer,
    });
  }

  async findAll(
    query: FindAllCurrenciesDto,
  ): Promise<{ data: Currency[]; totalCount: number }> {
    // Support both take/skip and page/limit patterns
    let skip: number;
    let take: number;

    if (query.take !== undefined || query.skip !== undefined) {
      // Use take/skip if provided
      skip = query.skip ?? 0;
      take = query.take ?? 50;
    } else {
      // Convert page/limit to take/skip
      const page = query.page ?? 1;
      const limit = query.limit ?? 50;
      skip = (page - 1) * limit;
      take = limit;
    }

    return this.currencyRepository.findAll({
      search: query.search,
      status: query.status,
      skip,
      take,
    });
  }

  async findById(id: Currency['id']): Promise<Currency> {
    const currency = await this.currencyRepository.findById(id);
    if (!currency) {
      throw new NotFoundException('Currency does not exist!');
    }
    return currency;
  }

  async update(
    id: Currency['id'],
    updateCurrencyDto: UpdateCurrencyDto,
    causer: User,
  ): Promise<Currency> {
    const currency = await this.findById(id);

    if (
      updateCurrencyDto.code &&
      updateCurrencyDto.code.toUpperCase() !== currency.code
    ) {
      const existing = await this.currencyRepository.findByCode(
        updateCurrencyDto.code,
      );
      if (existing && existing.id !== currency.id) {
        throw new ConflictException('Currency code already exists');
      }
    }

    return this.currencyRepository.update(id, {
      ...updateCurrencyDto,
      updated_by: causer,
    });
  }

  async remove(id: Currency['id'], causer: User): Promise<void> {
    await this.findById(id);
    await this.currencyRepository.remove(id, causer?.id);
  }
}
