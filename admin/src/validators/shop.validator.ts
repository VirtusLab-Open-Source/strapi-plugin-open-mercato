import { z } from 'zod';

export type ShopProductSchema = z.infer<typeof shopProductSchema>;
export const shopProductSchema = z.object({
  id: z.union([z.string(), z.number()]),
  title: z.string(),
  default_media_url: z.string().nullable(),
});
