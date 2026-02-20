import { z } from 'zod';

export const fetchSettingsSchema = z.object({
  apiUrl: z.string().default(''),
  accessToken: z.string().default(''),
  configured: z.boolean().default(false),
});

export type FetchSettingsFormSchema = z.infer<typeof fetchSettingsSchema>;

export const reqSettingsSchema = z.object({
  apiUrl: z
    .string({ message: 'form.errors.required' })
    .url({ message: 'Must be a valid URL' }),
  accessToken: z
    .string({ message: 'form.errors.required' })
    .min(1, { message: 'Access Token is required' }),
});

export type ReqSettingsFormSchema = z.infer<typeof reqSettingsSchema>;
