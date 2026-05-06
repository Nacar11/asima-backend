import { Controller, Get, Query } from '@nestjs/common';
import { ApiOkResponse, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ServicesService } from '@/services/services.service';
import { QueryServiceDto } from '@/services/dto/query-service.dto';
import { Service as ServiceModel } from '@/services/domain/service';
import { ServiceTypeEnum } from '@/services/enums/service-type.enum';

@ApiTags('Services')
@Controller({
  path: 'services',
  version: '1',
})
export class PublicServicesController {
  constructor(private readonly service: ServicesService) {}

  @Get('venues')
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search by service title or code (case-insensitive)',
  })
  @ApiQuery({
    name: 'title',
    required: false,
    type: String,
    description: 'Filter by service title (case-insensitive partial match)',
  })
  @ApiQuery({
    name: 'sortField',
    required: false,
    type: String,
    enum: [
      'title',
      'created_at',
      'updated_at',
      'base_price',
      'hourly_rate',
      'average_rating',
      'total_bookings',
      'view_count',
      'category_id',
      'seller_id',
      'status',
    ],
    description: 'Field to sort by (default: created_at)',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    type: String,
    enum: ['ASC', 'DESC'],
    description: 'Sort direction (default: DESC)',
  })
  @ApiOkResponse({ type: ServiceModel, isArray: true })
  async findAllVenueServices(@Query() query: QueryServiceDto) {
    const queryParams: QueryServiceDto = {
      ...query,
      service_type: ServiceTypeEnum.VENUE,
    };

    // Convert page/limit to skip/take if provided (prioritize page/limit over skip/take)
    if (query.page !== undefined || query.limit !== undefined) {
      const page = query.page ?? 1;
      const limit = query.limit ?? 20;
      queryParams.skip = (page - 1) * limit;
      queryParams.take = limit;
    }

    const { data, totalCount } = await this.service.findAll(queryParams);
    return { data, totalCount };
  }
}
