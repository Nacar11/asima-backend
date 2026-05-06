export type TopProductRow = {
  rank: number;
  product_id: number;
  product_name: string;
  sku: string;
  category: string | null;
  units_sold: number;
  revenue: number;
  url: string | null;
};
