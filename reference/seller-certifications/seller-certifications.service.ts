import { Injectable, NotFoundException } from '@nestjs/common';
import { BaseSellerCertificationRepository } from '@/seller-certifications/persistence/base-seller-certification.repository';
import { SellerCertification } from '@/seller-certifications/domain/seller-certification';
import { CreateSellerCertificationDto } from '@/seller-certifications/dto/create-seller-certification.dto';
import { UpdateSellerCertificationDto } from '@/seller-certifications/dto/update-seller-certification.dto';
import { QuerySellerCertificationDto } from '@/seller-certifications/dto/query-seller-certification.dto';
import { User } from '@/users/domain/user';
import { SellersService } from '@/sellers/sellers.service';

@Injectable()
export class SellerCertificationsService {
  constructor(
    private readonly repository: BaseSellerCertificationRepository,
    private readonly sellersService: SellersService,
  ) {}

  async create(
    dto: CreateSellerCertificationDto,
    causer: User,
  ): Promise<SellerCertification> {
    // Verify seller exists
    await this.sellersService.findById(dto.seller_id);

    const certification = Object.assign(new SellerCertification(), dto, {
      issue_date: dto.issue_date ? new Date(dto.issue_date) : null,
      expiry_date: dto.expiry_date ? new Date(dto.expiry_date) : null,
      status: dto.status ?? 'Active',
      created_by: causer,
      updated_by: causer,
    });

    return this.repository.create(certification);
  }

  async findAll(query: QuerySellerCertificationDto): Promise<{
    data: SellerCertification[];
    totalCount: number;
  }> {
    return this.repository.findAll(query);
  }

  async findById(id: number): Promise<SellerCertification> {
    const certification = await this.repository.findById(id);
    if (!certification) {
      throw new NotFoundException('Seller Certification not found');
    }
    return certification;
  }

  async update(
    id: number,
    dto: UpdateSellerCertificationDto,
    causer: User,
  ): Promise<SellerCertification> {
    await this.findById(id);

    if (dto.seller_id) {
      await this.sellersService.findById(dto.seller_id);
    }

    // Build update data without date fields from DTO
    const { issue_date, expiry_date, ...restDto } = dto;
    const updateData: Partial<SellerCertification> = {
      ...restDto,
      updated_by: causer,
    };

    if (issue_date) {
      updateData.issue_date = new Date(issue_date);
    }
    if (expiry_date) {
      updateData.expiry_date = new Date(expiry_date);
    }

    return this.repository.update(id, updateData);
  }

  async remove(id: number, causer: User): Promise<void> {
    await this.findById(id);
    await this.repository.remove(id, causer?.id);
  }
}
