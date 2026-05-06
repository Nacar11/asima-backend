export type GetQueryParams = {
  skip?: number;
  take?: number;
  sort?: {
    [key: string]: 'ASC' | 'DESC';
  };
  filter?: (string | string[])[];
};
