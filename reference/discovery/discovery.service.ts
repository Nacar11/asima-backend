import { Injectable } from '@nestjs/common';
import { EdistrictService } from '@/discovery/edistrict.service';
import { EdistrictResponseDto } from '@/discovery/dto/edistrict-response.dto';
import { DistrictMerchantResponseDto } from '@/discovery/dto/district-merchant-response.dto';

@Injectable()
export class DiscoveryService {
  constructor(private readonly edistrictService: EdistrictService) {}

  async findVisibleEdistricts(
    userId: number | null,
    skip = 0,
    take = 20,
  ): Promise<{
    data: EdistrictResponseDto[];
    totalCount: number;
    skip: number;
    take: number;
  }> {
    return this.edistrictService.findVisibleEdistricts(userId, skip, take);
  }

  async findMerchantsByEdistrictId(
    id: number,
    skip = 0,
    take = 20,
  ): Promise<{
    data: DistrictMerchantResponseDto[];
    totalCount: number;
    skip: number;
    take: number;
  }> {
    return this.edistrictService.findMerchantsByEdistrictId(id, skip, take);
  }
}
