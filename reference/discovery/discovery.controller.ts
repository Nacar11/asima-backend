import {
  Controller,
  Get,
  Param,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiNotFoundResponse,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtGuard } from '@/utils/guards/jwt.guard';
import { Public } from '@/utils/decorators/public.decorator';
import { DiscoveryService } from '@/discovery/discovery.service';
import { EdistrictResponseDto } from '@/discovery/dto/edistrict-response.dto';
import { DistrictMerchantResponseDto } from '@/discovery/dto/district-merchant-response.dto';

@ApiTags('Discovery')
@UseGuards(JwtGuard)
@Controller({ path: 'discovery', version: '1' })
export class DiscoveryController {
  constructor(private readonly discoveryService: DiscoveryService) {}

  @Get('edistricts')
  @Public()
  @ApiQuery({
    name: 'skip',
    required: false,
    type: Number,
    example: 0,
    description: 'Number of items to skip (default: 0)',
  })
  @ApiQuery({
    name: 'take',
    required: false,
    type: Number,
    example: 20,
    description: 'Number of items to take/return (default: 20)',
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of visible edistricts',
    schema: {
      type: 'object',
      properties: {
        data: { type: 'array', items: { $ref: '#/components/schemas/EdistrictResponseDto' } },
        totalCount: { type: 'number' },
        skip: { type: 'number' },
        take: { type: 'number' },
      },
    },
  })
  async findEdistricts(
    @Request() req: { user?: { id: number } },
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ): Promise<{
    data: EdistrictResponseDto[];
    totalCount: number;
    skip: number;
    take: number;
  }> {
    const userId = req.user?.id ?? null;
    return this.discoveryService.findVisibleEdistricts(
      userId,
      skip !== undefined ? parseInt(skip, 10) : 0,
      take !== undefined ? parseInt(take, 10) : 20,
    );
  }

  @Get('edistricts/:id/merchants')
  @Public()
  @ApiQuery({
    name: 'skip',
    required: false,
    type: Number,
    example: 0,
    description: 'Number of items to skip (default: 0)',
  })
  @ApiQuery({
    name: 'take',
    required: false,
    type: Number,
    example: 20,
    description: 'Number of items to take/return (default: 20)',
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of merchants for the edistrict',
    schema: {
      type: 'object',
      properties: {
        data: { type: 'array', items: { $ref: '#/components/schemas/DistrictMerchantResponseDto' } },
        totalCount: { type: 'number' },
        skip: { type: 'number' },
        take: { type: 'number' },
      },
    },
  })
  @ApiNotFoundResponse({ description: 'Edistrict not found' })
  async findMerchantsByEdistrict(
    @Param('id') id: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ): Promise<{
    data: DistrictMerchantResponseDto[];
    totalCount: number;
    skip: number;
    take: number;
  }> {
    return this.discoveryService.findMerchantsByEdistrictId(
      Number(id),
      skip !== undefined ? parseInt(skip, 10) : 0,
      take !== undefined ? parseInt(take, 10) : 20,
    );
  }
}
