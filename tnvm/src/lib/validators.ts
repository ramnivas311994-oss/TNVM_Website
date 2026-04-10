import { z } from 'zod'

// Login validation
export const loginSchema = z.object({
  email: z.string().email('Invalid email address').toLowerCase().trim(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export type LoginInput = z.infer<typeof loginSchema>

// Register validation
export const registerSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters').max(100).trim(),
  email: z.string().email('Invalid email address').toLowerCase().trim(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirm_password: z.string(),
}).refine((data) => data.password === data.confirm_password, {
  message: "Passwords don't match",
  path: ["confirm_password"],
})

export type RegisterInput = z.infer<typeof registerSchema>
