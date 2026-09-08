import { z } from 'zod';

export const addressSchema = z.object({
  line1: z.string().min(1, 'Address is required'),
  line2: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  region: z.string().min(1, 'State / region is required'),
  postalCode: z.string().min(1, 'ZIP / postal code is required'),
  country: z.string().min(2, 'Country is required'),
});

export const deliverySchema = z.object({
  phone: z.string().min(7, 'Enter a valid phone number'),
  address: addressSchema,
});

export const loginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const registerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  phone: z.string().min(7, 'Enter a valid phone number'),
  address: addressSchema,
});

export const profileSchema = z.object({
  name: z.string().min(1, 'Name is required'),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
export type RegisterFormValues = z.infer<typeof registerSchema>;
export type DeliveryFormValues = z.infer<typeof deliverySchema>;
export type ProfileFormValues = z.infer<typeof profileSchema>;

export const emptyDeliveryValues: DeliveryFormValues = {
  phone: '',
  address: {
    line1: '',
    line2: '',
    city: '',
    region: '',
    postalCode: '',
    country: 'US',
  },
};
