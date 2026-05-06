import { Controller, Get, Request, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '@/utils/decorators/public.decorator';
import { JwtGuard } from '@/utils/guards/jwt.guard';
import { PickleballLocationsService } from '@/pickleball-merchants/pickleball-locations.service';
import { PickleballLocationResponseDto } from '@/pickleball-merchants/dto/pickleball-location-response.dto';

@ApiTags('Public - Pickleball Locations')
@UseGuards(JwtGuard)
@Controller({ path: 'pickleball-locations', version: '1' })
export class PickleballLocationsController {
  constructor(
    private readonly pickleballLocationsService: PickleballLocationsService,
  ) {}

  @Get()
  @Public()
  @ApiOkResponse({ type: PickleballLocationResponseDto, isArray: true })
  async findAll(
    @Request() req: { user?: { id: number } },
  ): Promise<PickleballLocationResponseDto[]> {
    const userId = req.user?.id ?? null;
    return this.pickleballLocationsService.findPublicLocations(userId);
  }
}
