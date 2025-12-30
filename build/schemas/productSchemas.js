import { Type } from "@sinclair/typebox";
export const ProductCreateBody = Type.Object({
  store_id: Type.String({ format: "uuid" }),
  sku: Type.Optional(Type.String()),
  name: Type.String(),
  slug: Type.Optional(Type.String()),
  description: Type.Optional(Type.String()),
  short_description: Type.Optional(Type.String()),
  base_price: Type.Optional(Type.Number()),
  compare_at_price: Type.Optional(Type.Number()),
  cost_price: Type.Optional(Type.Number()),
  currency: Type.Optional(Type.String()),
  weight_grams: Type.Optional(Type.Number()),
  package_length_cm: Type.Optional(Type.Number()),
  package_width_cm: Type.Optional(Type.Number()),
  package_height_cm: Type.Optional(Type.Number()),
  meta_title: Type.Optional(Type.String()),
  meta_description: Type.Optional(Type.String()),
  search_keywords: Type.Optional(Type.Array(Type.String())),
  is_featured: Type.Optional(Type.Boolean()),
  is_trending: Type.Optional(Type.Boolean()),
  is_new_arrival: Type.Optional(Type.Boolean()),
  is_bestseller: Type.Optional(Type.Boolean())
}, { additionalProperties: true });
export const ProductUpdateBody = Type.Partial(ProductCreateBody);
export const ProductQuery = Type.Object({
  userId: Type.Optional(Type.String({ format: "uuid" })),
  store_id: Type.Optional(Type.String({ format: "uuid" })),
  category_id: Type.Optional(Type.String({ format: "uuid" })),
  status: Type.Optional(Type.String()),
  name: Type.Optional(Type.String()),
  is_featured: Type.Optional(Type.Boolean()),
  is_trending: Type.Optional(Type.Boolean()),
  is_new_arrival: Type.Optional(Type.Boolean()),
  is_bestseller: Type.Optional(Type.Boolean()),
  is_sales_enabled: Type.Optional(Type.Boolean()),
  page: Type.Optional(Type.Number()),
  limit: Type.Optional(Type.Number()),
  average_rating: Type.Optional(Type.Number()),
  min_price: Type.Optional(Type.Number()),
  max_price: Type.Optional(Type.Number())
}, { additionalProperties: true });
const ProductStoreQuery = Type.Object({
  page: Type.Optional(Type.Number()),
  limit: Type.Optional(Type.Number()),
  name: Type.Optional(Type.String()),
  status: Type.Optional(Type.String()),
  collection_id: Type.Optional(Type.String({ format: "uuid" })),
  start_date: Type.Optional(Type.String()),
  end_date: Type.Optional(Type.String())
}, { additionalProperties: true });
export const VariantCreateBody = Type.Object({
  product_id: Type.String({ format: "uuid" }),
  sku: Type.String(),
  barcode: Type.Optional(Type.String()),
  price: Type.Optional(Type.Number()),
  compare_at_price: Type.Optional(Type.Number()),
  cost_price: Type.Optional(Type.Number()),
  weight_grams: Type.Optional(Type.Number()),
  stock_quantity: Type.Optional(Type.Number()),
  stock_reserved: Type.Optional(Type.Number()),
  low_stock_threshold: Type.Optional(Type.Number()),
  allow_backorder: Type.Optional(Type.Boolean()),
  position: Type.Optional(Type.Number()),
  is_default: Type.Optional(Type.Boolean())
}, { additionalProperties: true });
export const VariantUpdateBody = Type.Partial(VariantCreateBody);
export const ImageUploadBody = Type.Object({
  product_id: Type.String({ format: "uuid" }),
  variant_id: Type.Optional(Type.String({ format: "uuid" })),
  alt_text: Type.Optional(Type.String()),
  thumbnail_url: Type.Optional(Type.String()),
  position: Type.Optional(Type.Number()),
  is_primary: Type.Optional(Type.Boolean())
}, { additionalProperties: true });
export const ReviewCreateBody = Type.Object({
  product_id: Type.String({ format: "uuid" }),
  rating: Type.Number({ minimum: 1, maximum: 5 }),
  title: Type.Optional(Type.String()),
  comment: Type.Optional(Type.String()),
  image_urls: Type.Optional(Type.Array(Type.String())),
  video_url: Type.Optional(Type.String()),
  is_verified_purchase: Type.Optional(Type.Boolean())
}, { additionalProperties: true });
export const ReviewUpdateBody = Type.Partial(ReviewCreateBody);
export const WishlistCreateBody = Type.Object({
  product_id: Type.String(),
  variant_id: Type.Optional(Type.String()),
  added_from_post: Type.Optional(Type.String())
}, { additionalProperties: true });
export const WishlistQuery = Type.Object({
  page: Type.Optional(Type.Number()),
  limit: Type.Optional(Type.Number())
}, { additionalProperties: true });
export default {
  ProductCreateBody,
  ProductUpdateBody,
  ProductQuery,
  VariantCreateBody,
  VariantUpdateBody,
  ImageUploadBody,
  ReviewCreateBody,
  ReviewUpdateBody,
  WishlistCreateBody,
  WishlistQuery,
  ProductStoreQuery
};
