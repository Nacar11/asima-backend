import {
  FindOptionsOrder,
  FindOptionsRelations,
  FindOptionsSelect,
  FindOptionsWhere,
} from 'typeorm';

export interface FindOptions<T> {
  select?: FindOptionsSelect<T>;
  relations?: FindOptionsRelations<T> | string[];
  where?: FindOptionsWhere<T> | FindOptionsWhere<T>[];
  order?: FindOptionsOrder<T>;
  withDeleted?: boolean;
  loadEagerRelations?: boolean;
  take?: number;
  skip?: number;
  helpers?: string[]; // TODO: Not yet finalized, need to investigate more of this implementation
}
