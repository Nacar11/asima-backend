import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseProductSpecificationRepository } from './persistence/base-product-specification.repository';
import { ProductSpecification } from './domain/product-specification';
import { FindAllProductSpecification } from './domain/find-all-product-specification';
import { CreateProductSpecificationDto } from './dto/create-product-specification.dto';
import { UpdateProductSpecificationDto } from './dto/update-product-specification.dto';
import { QueryProductSpecificationDto } from './dto/query-product-specification.dto';
import { User } from '@/users/domain/user';
import { ProductEntity } from '@/products/persistence/entities/product.entity';
import { SellerEntity } from '@/sellers/persistence/entities/seller.entity';
import { getCauser } from '@/utils/helpers/entity.helper';
import { UserEntity } from '@/users/persistence/entities/user.entity';

/**
 * Service for product specification business logic
 */
@Injectable()
export class ProductSpecificationsService {
  constructor(
    private readonly repository: BaseProductSpecificationRepository,
    @InjectRepository(ProductEntity)
    private readonly productRepository: Repository<ProductEntity>,
    @InjectRepository(SellerEntity)
    private readonly sellerRepository: Repository<SellerEntity>,
  ) {}

  async create(
    dto: CreateProductSpecificationDto,
    causer: User,
  ): Promise<ProductSpecification> {
    const product = await this.productRepository.findOne({
      where: { id: dto.product_id },
    });
    if (!product) {
      throw new NotFoundException(`Product not found`);
    }
    const seller = await this.sellerRepository.findOne({
      where: { id: product.seller_id, user_id: causer.id },
    });
    if (!seller) {
      throw new ForbiddenException(
        'You can only create specifications for products that belong to you',
      );
    }
    const domainModel = new ProductSpecification();
    Object.assign(domainModel, dto);
    domainModel.sort_order = dto.sort_order ?? 0;
    domainModel.created_by = causer;
    domainModel.updated_by = causer;
    return this.repository.create(domainModel);
  }

  async findAll(
    query: QueryProductSpecificationDto,
  ): Promise<FindAllProductSpecification> {
    return this.repository.findAll(query);
  }

  async findById(id: number, causer: User): Promise<ProductSpecification> {
    const specification = await this.repository.findById(id);

    if (!specification) {
      throw new NotFoundException(
        `Product specification with ID ${id} not found`,
      );
    }
    const product = await this.productRepository.findOne({
      where: { id: specification.product_id },
    });

    if (!product) {
      throw new NotFoundException('Associated product not found');
    }

    const seller = await this.sellerRepository.findOne({
      where: {
        id: product.seller_id,
        user_id: causer.id,
      },
    });

    if (!seller) {
      throw new ForbiddenException(
        'You can only view specifications for products that belong to you',
      );
    }

    return specification;
  }

  async update(
    id: number,
    input: UpdateProductSpecificationDto,
    causer: User,
  ): Promise<ProductSpecification> {
    const specification = await this.findById(id, causer);
    const product = await this.productRepository.findOne({
      where: { id: specification.product_id },
    });
    if (!product) {
      throw new NotFoundException(`Product with not found`);
    }
    const seller = await this.sellerRepository.findOne({
      where: { id: product.seller_id, user_id: causer.id },
    });
    if (!seller) {
      throw new ForbiddenException(
        'You can only update specifications for products that belong to you',
      );
    }
    const updatePayload: Partial<ProductSpecification> = {
      ...input,
      updated_by: getCauser(causer as UserEntity),
    };
    return this.repository.update(id, updatePayload);
  }

  async delete(id: number, causer: User): Promise<void> {
    const specification = await this.findById(id, causer);
    const product = await this.productRepository.findOne({
      where: { id: specification.product_id },
    });
    if (!product) {
      throw new NotFoundException(`Product with not found`);
    }
    const seller = await this.sellerRepository.findOne({
      where: { id: product.seller_id, user_id: causer.id },
    });
    if (!seller) {
      throw new ForbiddenException(
        'You can only delete specifications for products that belong to you',
      );
    }
    await this.repository.remove(id);
  }
}
