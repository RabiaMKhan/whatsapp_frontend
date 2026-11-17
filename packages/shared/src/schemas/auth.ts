import { z } from 'zod';
import { AUTH_CODE, LIMITS } from '../constants';
import { emailSchema } from './common';

export const passwordSchema = z
  .string()
  .min(LIMITS.PASSWORD_MIN, `Password must be at least ${LIMITS.PASSWORD_MIN} characters`)
  .max(LIMITS.PASSWORD_MAX, 'Password is too long');

/** The 6-digit code from the email. */
export const authCodeSchema = z
  .string()
  .trim()
  .regex(new RegExp(`^\\d{${AUTH_CODE.LENGTH}}$`), `Enter the ${AUTH_CODE.LENGTH}-digit code from the email`);

export const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(LIMITS.NAME_MIN, `Name must be at least ${LIMITS.NAME_MIN} characters`)
    .max(LIMITS.NAME_MAX, `Name must be at most ${LIMITS.NAME_MAX} characters`),
  email: emailSchema,
  password: passwordSchema,
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required').max(LIMITS.PASSWORD_MAX),
});

export const verifyEmailSchema = z.object({
  email: emailSchema,
  code: authCodeSchema,
});

/** Used by "resend verification code" and "forgot password". */
export const emailOnlySchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z.object({
  email: emailSchema,
  code: authCodeSchema,
  password: passwordSchema,
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
export type EmailOnlyInput = z.infer<typeof emailOnlySchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
