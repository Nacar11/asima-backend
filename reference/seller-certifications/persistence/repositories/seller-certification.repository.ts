import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, ILike, Repository } from 'typeorm';
import { BaseSellerCertificationRepository } from '@/seller-certifications/persistence/base-seller-certification.repository';
import { SellerCertificationEntity } from '@/seller-certifications/persistence/entities/seller-certification.entity';
import { SellerCertificationMapper } from '@/seller-certifications/persistence/mappers/seller-certification.mapper';
import { SellerCertification } from '@/seller-certifications/domain/seller-certification';
import { QuerySellerCertificationDto } from '@/seller-certifications/dto/query-seller-certification.dto';

@Injectable()
export class SellerCertificationRepository
  implements BaseSellerCertificationRepository
{
  constructor(
    @InjectRepository(SellerCertificationEntity)
    private readonly repo: Repository<SellerCertificationEntity>,
  ) {}

  async create(
    data: Omit<
      SellerCertification,
      'id' | 'created_at' | 'updated_at' | 'deleted_at'
    >,
  ): Promise<SellerCertification> {
    const entity = this.repo.create(
      SellerCertificationMapper.toPersistence(data),
    );
    const saved = await this.repo.save(entity);
    const withRelations = await this.repo.findOne({
      where: { id: saved.id },
      relations: ['created_by', 'updated_by'],
    });
    return SellerCertificationMapper.toDomain(withRelations ?? saved);
  }

  async findAll(
    query: QuerySellerCertificationDto,
  ): Promise<{ data: SellerCertification[]; totalCount: number }> {
    const skip = query.skip ?? 0;
    const take = query.take ?? 20;

    const where: FindOptionsWhere<SellerCertificationEntity>[] = [];

    if (query.seller_id !== undefined) {
      where.push({ seller_id: query.seller_id });
    }
    if (query.status !== undefined) {
      where.push({ status: query.status });
    }
    if (query.search) {
      const like = ILike(`%${query.search}%`);
      where.push({ name: like });
      where.push({ issuer: like });
    }

    if (where.length === 0) where.push({});

    const [entities, totalCount] = await this.repo.findAndCount({
      where,
      skip,
      take,
      order: { created_at: 'DESC' },
      relations: ['created_by', 'updated_by'],
    });

    return {
      data: entities.map((e) => SellerCertificationMapper.toDomain(e)),
      totalCount,
    };
  }

  async findById(id: number): Promise<SellerCertification | null> {
    const entity = await this.repo.findOne({
      where: { id },
      relations: ['created_by', 'updated_by'],
    });
    return entity ? SellerCertificationMapper.toDomain(entity) : null;
  }

  async update(
    id: number,
    payload: Partial<SellerCertification>,
  ): Promise<SellerCertification> {
    const existing = await this.repo.findOne({ where: { id } });
    if (!existing)
      throw new NotFoundException('Seller Certification not found');

    await this.repo.save(
      this.repo.create({
        ...SellerCertificationMapper.toPersistence(
          SellerCertificationMapper.toDomain(existing),
        ),
        ...SellerCertificationMapper.toPersistence(payload),
      }),
    );

    const updated = await this.repo.findOne({
      where: { id },
      relations: ['created_by', 'updated_by'],
    });
    return SellerCertificationMapper.toDomain(updated!);
  }

  async remove(id: number, causerId?: number): Promise<void> {
    const existing = await this.repo.findOne({ where: { id } });
    if (!existing)
      throw new NotFoundException('Seller Certification not found');
    if (causerId) {
      await this.repo.save({
        id,
        deleted_by: { id: causerId } as any,
      });
    }
    await this.repo.softDelete(id);
  }
}
