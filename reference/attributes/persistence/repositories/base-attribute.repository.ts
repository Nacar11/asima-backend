import { Attribute } from '../../domain/attribute';
import { FindAllAttribute } from '../../domain/find-all-attribute';
import { CreateAttributeDto } from '../../dto/create-attribute.dto';
import { UpdateAttributeDto } from '../../dto/update-attribute.dto';
import { QueryAttributeDto } from '../../dto/query-attribute.dto';

export abstract class BaseAttributeRepository {
  abstract create(attribute: CreateAttributeDto): Promise<Attribute>;
  abstract findAll(
    query: QueryAttributeDto,
    sellerId?: number | null,
  ): Promise<FindAllAttribute>;
  abstract findById(id: number): Promise<Attribute | null>;
  abstract update(
    id: number,
    attribute: UpdateAttributeDto,
  ): Promise<Attribute>;
  abstract remove(id: number): Promise<void>;
}
