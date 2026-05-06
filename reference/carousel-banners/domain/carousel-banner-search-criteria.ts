export type CarouselBannerSearchCriteria = {
  headline?: string;
  isActive?: boolean;
  onlyCurrentlyActive?: boolean;
  mediaId?: number;
  devExtremeFilter?: unknown;
  devExtremeSort?: unknown;
  sortOrder?: 'ASC' | 'DESC';
  sort?: {
    field: 'display_order' | 'created_at';
    direction: 'ASC' | 'DESC';
  };
  skip?: number;
  take?: number;
};
