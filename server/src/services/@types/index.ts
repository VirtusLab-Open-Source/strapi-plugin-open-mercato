export type ProductService = {
  getProductsById: (products: string[]) => Promise<Map<string, OpenMercatoRestProduct>>;
  searchProducts: (query: string, vendor?: string) => Promise<any>;
};

export interface OpenMercatoRestProductCustomFields {
  key: string,
  label: string,
  value: string | null,
  kind: string,
  multi: boolean,
}

export interface OpenMercatoRestProductPricingScope {
  variant_id: string,
  offer_id: string,
  channel_id: string,
  user_id: string | null,
  user_group_id: string | null,
  customer_id: string | null,
  customer_group_id: string | null,
}

export interface OpenMercatoRestProductPricing {
  kind: string,
  price_kind_id: string,
  price_kind_code: string,
  currency_code: string,
  unit_price_net: string | null,
  unit_price_gross: string | null,
  min_quantity: number | null,
  max_quantity: number | null,
  tax_rate: string,
  tax_amount: string | null,
  scope: OpenMercatoRestProductPricingScope | null;
};

export interface OpenMercatoRestProduct {
  id: string;
  title: string | null;
  subtitle: string | null;
  description: string | null;
  sku: string | null;
  handle: string | null;
  product_type: string | null;
  status_entry_id: string | null;
  primary_currency_code: string | null;
  default_unit: string | null;
  default_media_id: string | null;
  default_media_url: string | null;
  weight_value: number | null;
  weight_unit: string | null;
  dimensions: Record<string, any> | null;
  is_configurable: boolean | null;
  is_active: boolean | null;
  metadata: Record<string, any> | null;
  custom_fieldset_code: string | null;
  option_schema_id: string | null;
  created_at: string | null;
  updated_at: string | null;
  pricing: OpenMercatoRestProductPricing | OpenMercatoRestProductPricing[] | null;
  customValues: Record<string, any> | null;
  customFields: OpenMercatoRestProductCustomFields[] | null;
  [key: string]: any;
}

export interface OpenMercatoRestProductResponse {
  items: OpenMercatoRestProduct[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
