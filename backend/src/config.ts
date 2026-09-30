import dotenv from 'dotenv'
import { z } from 'zod'

dotenv.config()

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  APP_DOMAIN: z.string().min(1).default('bst-maintenance.local'),
  BRANCH_DOMAIN: z.string().min(1).optional(),
  API_HOST: z.string().min(1).optional(),
  DATABASE_URL: z.string().min(1).default('mysql://bst_user:change-me@127.0.0.1:3306/bst_invoice'),
  JWT_SECRET: z.string().min(32).default('development-only-change-this-secret-32'),
  JWT_EXPIRES_IN: z.string().min(1).default('8h'),
  JWT_REMEMBER_EXPIRES_IN: z.string().min(1).default('30d'),
  REMEMBER_ME_MAX_AGE_SECONDS: z.coerce.number().int().positive().default(2_592_000),
  CORS_ORIGINS: z.string().default('http://localhost:5173'),
  APP_VERSION: z.string().default('0.1.0'),
})

export const config = envSchema.parse(process.env)

export const corsOrigins = config.CORS_ORIGINS.split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)
