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
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { ServiceAreasService } from '@/service-areas/service-areas.service';
import { CreateServiceAreaDto } from '@/service-areas/dto/create-service-area.dto';
import { UpdateServiceAreaDto } from '@/service-areas/dto/update-service-area.dto';
import { QueryServiceAreaDto } from '@/service-areas/dto/query-service-area.dto';
import {
  CheckLocationCoverageDto,
  LocationCoverageResponseDto,
} from '@/service-areas/dto/check-location-coverage.dto';
import { ServiceArea } from '@/service-areas/domain/service-area';
import { CurrentUser } from '@/utils/decorators/current-user.decorator';
import { User } from '@/users/domain/user';
import { PermissionsGuard } from '@/user-permissions/user-permissions.guard';
import { Permissions } from '@/user-permissions/persistence/user-permissions.decorator';

@ApiTags('Service Areas')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
@Controller({
  path: 'service-areas',
  version: '1',
})
export class ServiceAreasController {
  constructor(private readonly service: ServiceAreasService) {}

  @Post()
  @Permissions({ SM12: 'Create' })
  @ApiCreatedResponse({ type: ServiceArea })
  create(@Body() dto: CreateServiceAreaDto, @CurrentUser() currentUser: User) {
    return this.service.create(dto, currentUser);
  }

  @Get()
  @Permissions({ SM12: 'View' })
  @ApiOkResponse({ type: ServiceArea, isArray: true })
  async findAll(@Query() query: QueryServiceAreaDto) {
    const { data, totalCount } = await this.service.findAll(query);
    return { data, totalCount };
  }

  /**
   * Check if a customer's location is covered by a service's service areas.
   *
   * This endpoint validates:
   * - Postal code match (exact)
   * - City + Province match (exact)
   * - Radius check using Haversine formula (if coordinates provided)
   *
   * @example
   * GET /v1/service-areas/check-coverage?service_id=1&city=Quezon%20City&province=Metro%20Manila
   * GET /v1/service-areas/check-coverage?service_id=1&latitude=14.5995&longitude=120.9842
   */
  @Get('check-coverage')
  @ApiOperation({
    summary: 'Check if location is covered by service',
    description: `
      Validates if a customer's location is within a service's defined service areas.
      
      **Matching Priority:**
      1. Postal code (exact match)
      2. City + Province (exact match)
      3. Radius (within defined radius_km using Haversine formula)
      
      If no service areas are defined, assumes global coverage (returns covered=true).
    `,
  })
  @ApiOkResponse({
    type: LocationCoverageResponseDto,
    description: 'Location coverage check result',
  })
  async checkLocationCoverage(
    @Query() query: CheckLocationCoverageDto,
  ): Promise<LocationCoverageResponseDto> {
    return this.service.checkLocationCoverage(query);
  }

  @Get(':id')
  @Permissions({ SM12: 'View' })
  @ApiParam({ name: 'id', type: Number })
  @ApiOkResponse({ type: ServiceArea })
  findOne(@Param('id') id: number) {
    return this.service.findById(id);
  }

  @Patch(':id')
  @Permissions({ SM12: 'Edit' })
  @ApiParam({ name: 'id', type: Number })
  @ApiOkResponse({ type: ServiceArea })
  update(
    @Param('id') id: number,
    @Body() dto: UpdateServiceAreaDto,
    @CurrentUser() currentUser: User,
  ) {
    return this.service.update(id, dto, currentUser);
  }

  @Delete(':id')
  @Permissions({ SM12: 'Delete' })
  @ApiParam({ name: 'id', type: Number })
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: number, @CurrentUser() currentUser: User) {
    return this.service.remove(id, currentUser);
  }
}
