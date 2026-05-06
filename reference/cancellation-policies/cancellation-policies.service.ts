import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { BaseCancellationPolicyRepository } from './persistence/base-cancellation-policy.repository';
import { CancellationPolicy } from './domain/cancellation-policy';
import { CreateCancellationPolicyDto } from './dto/create-cancellation-policy.dto';
import { UpdateCancellationPolicyDto } from './dto/update-cancellation-policy.dto';
import { QueryCancellationPolicyDto } from './dto/query-cancellation-policy.dto';
import { IPaginatedResult } from '@/utils/types/paginated-result';

@Injectable()
export class CancellationPoliciesService {
  constructor(private readonly repository: BaseCancellationPolicyRepository) {}

  async create(dto: CreateCancellationPolicyDto): Promise<CancellationPolicy> {
    // Validate hours logic
    if (dto.partial_cancel_hours >= dto.free_cancel_hours) {
      throw new BadRequestException(
        'partial_cancel_hours must be less than free_cancel_hours',
      );
    }

    return this.repository.create({
      ...dto,
      no_show_charge_percent: dto.no_show_charge_percent ?? 100,
      status: 'Active',
    });
  }

  async findAll(
    query: QueryCancellationPolicyDto,
  ): Promise<IPaginatedResult<CancellationPolicy>> {
    return this.repository.findAll(query);
  }

  async findById(id: number): Promise<CancellationPolicy> {
    const policy = await this.repository.findById(id);
    if (!policy) {
      throw new NotFoundException('Cancellation policy not found');
    }
    return policy;
  }

  async findBySellerId(sellerId: number): Promise<CancellationPolicy[]> {
    return this.repository.findBySellerId(sellerId);
  }

  async findByServiceId(serviceId: number): Promise<CancellationPolicy | null> {
    return this.repository.findByServiceId(serviceId);
  }

  async findDefault(): Promise<CancellationPolicy | null> {
    return this.repository.findDefault();
  }

  /**
   * Get applicable policy for a service/seller with fallback to default
   */
  async getApplicablePolicy(
    serviceId?: number,
    sellerId?: number,
  ): Promise<CancellationPolicy | null> {
    // Priority: Service-specific > Seller-specific > Platform default
    if (serviceId) {
      const servicePolicy = await this.repository.findByServiceId(serviceId);
      if (servicePolicy) return servicePolicy;
    }

    if (sellerId) {
      const sellerPolicies = await this.repository.findBySellerId(sellerId);
      // Get seller's default policy (one without service_id)
      const sellerDefault = sellerPolicies.find((p) => !p.service_id);
      if (sellerDefault) return sellerDefault;
    }

    // Fallback to platform default
    return this.repository.findDefault();
  }

  async update(
    id: number,
    dto: UpdateCancellationPolicyDto,
  ): Promise<CancellationPolicy> {
    const existing = await this.findById(id);

    // Validate hours logic if both are being updated
    const freeHours = dto.free_cancel_hours ?? existing.free_cancel_hours;
    const partialHours =
      dto.partial_cancel_hours ?? existing.partial_cancel_hours;

    if (partialHours >= freeHours) {
      throw new BadRequestException(
        'partial_cancel_hours must be less than free_cancel_hours',
      );
    }

    return this.repository.update(id, dto);
  }

  async remove(id: number): Promise<void> {
    await this.findById(id); // Verify exists
    await this.repository.remove(id);
  }
}
