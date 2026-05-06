import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseSellerMemberServiceRepository } from '@/seller-member-services/persistence/base-seller-member-service.repository';
import { SellerMemberServiceEntity } from '@/seller-member-services/persistence/entities/seller-member-service.entity';
import { SellerMemberServiceMapper } from '@/seller-member-services/persistence/mappers/seller-member-service.mapper';
import { SellerMemberService } from '@/seller-member-services/domain/seller-member-service';

@Injectable()
export class SellerMemberServiceRepository
  implements BaseSellerMemberServiceRepository
{
  constructor(
    @InjectRepository(SellerMemberServiceEntity)
    private readonly repo: Repository<SellerMemberServiceEntity>,
  ) {}

  async create(data: SellerMemberService): Promise<SellerMemberService> {
    const saved = await this.repo.save(
      this.repo.create(SellerMemberServiceMapper.toPersistence(data)),
    );
    const withRelations = await this.repo.findOne({
      where: { id: saved.id },
      relations: ['seller_member', 'created_by', 'updated_by', 'deleted_by'],
    });
    return SellerMemberServiceMapper.toDomain(withRelations ?? saved);
  }

  async findById(id: number): Promise<SellerMemberService | null> {
    const entity = await this.repo.findOne({
      where: { id },
      relations: ['seller_member', 'created_by', 'updated_by', 'deleted_by'],
    });
    return entity ? SellerMemberServiceMapper.toDomain(entity) : null;
  }

  async findAll(): Promise<SellerMemberService[]> {
    const entities = await this.repo.find({
      relations: ['seller_member', 'created_by', 'updated_by', 'deleted_by'],
      order: { created_at: 'DESC' },
    });
    return entities.map((e) => SellerMemberServiceMapper.toDomain(e));
  }

  async update(
    id: number,
    payload: Partial<SellerMemberService>,
  ): Promise<SellerMemberService> {
    const existing = await this.repo.findOne({ where: { id } });
    if (!existing) throw new Error('Seller member service not found');

    const updated = await this.repo.save(
      this.repo.create(
        SellerMemberServiceMapper.toPersistence({
          ...SellerMemberServiceMapper.toDomain(existing),
          ...payload,
        }),
      ),
    );

    const withRelations = await this.repo.findOne({
      where: { id: updated.id },
      relations: ['seller_member', 'created_by', 'updated_by', 'deleted_by'],
    });

    return SellerMemberServiceMapper.toDomain(withRelations ?? updated);
  }

  async remove(id: number): Promise<void> {
    await this.repo.softDelete(id);
  }
}
