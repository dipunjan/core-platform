import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const productSchema = z.object({
  name: z.string().min(1, 'Enter a product name.'),
  sku: z.string().min(1, 'Enter a SKU (stock-keeping unit).'),
  description: z.string().min(1, 'Add a short description shoppers will see.'),
  price: z.coerce.number().min(0, 'Enter a valid price in cents (0 or more).'),
  category: z.string().min(1, 'Choose a category.'),
  featured: z.boolean(),
});

export const categoryCreateSchema = z.object({
  slug: z
    .string()
    .min(1, 'Enter a slug, e.g. shoes.')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase letters, numbers, and hyphens only.'),
  name: z.string().min(1, 'Enter a display name, e.g. Shoes.'),
  blurb: z.string(),
  showInNav: z.boolean(),
  showOnHome: z.boolean(),
});

export const categoryEditSchema = categoryCreateSchema.omit({ slug: true });

export type LoginFormValues = z.infer<typeof loginSchema>;
export type ProductFormValues = z.infer<typeof productSchema>;
export type CategoryCreateValues = z.infer<typeof categoryCreateSchema>;
export type CategoryEditValues = z.infer<typeof categoryEditSchema>;
