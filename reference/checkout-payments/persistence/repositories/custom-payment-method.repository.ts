import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CustomPaymentMethodEntity } from '@/checkout-payments/persistence/entities/custom-payment-method.entity';

@Injectable()
export class CustomPaymentMethodRepository {
  constructor(
    @InjectRepository(CustomPaymentMethodEntity)
    private readonly repo: Repository<CustomPaymentMethodEntity>,
  ) {}

  findAllEnabled(): Promise<CustomPaymentMethodEntity[]> {
    return this.repo.find({
      where: { is_enabled: true },
      order: { sort_order: 'ASC' },
    });
  }

  findAll(): Promise<CustomPaymentMethodEntity[]> {
    return this.repo.find({
      order: { sort_order: 'ASC' },
    });
  }

  findById(id: number): Promise<CustomPaymentMethodEntity | null> {
    return this.repo.findOne({ where: { id } });
  }

  findByCode(code: string): Promise<CustomPaymentMethodEntity | null> {
    return this.repo.findOne({ where: { code } });
  }

  async create(data: {
    name: string;
    description?: string | null;
    icon_url?: string | null;
    qr_image_url?: string | null;
    is_enabled: boolean;
    sort_order: number;
  }): Promise<CustomPaymentMethodEntity> {
    const entity = this.repo.create(data);
    return this.repo.save(entity);
  }

  async update(
    id: number,
    data: Partial<{
      name: string;
      description: string | null;
      icon_url: string | null;
      qr_image_url: string | null;
      is_enabled: boolean;
      sort_order: number;
    }>,
  ): Promise<CustomPaymentMethodEntity | null> {
    await this.repo.save({ id, ...data });
    return this.findById(id);
  }

  async softDelete(id: number): Promise<void> {
    await this.repo.softDelete(id);
  }
}
