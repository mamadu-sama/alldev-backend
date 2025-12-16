import { z } from "zod";

/**
 * Schema para completar o onboarding
 */
export const completeOnboardingSchema = z.object({
  completed: z.boolean().optional().default(true),
});

/**
 * Schema para resetar o onboarding
 */
export const resetOnboardingSchema = z.object({
  reset: z.boolean().optional().default(true),
});

/**
 * Types
 */
export type CompleteOnboardingInput = z.infer<typeof completeOnboardingSchema>;
export type ResetOnboardingInput = z.infer<typeof resetOnboardingSchema>;
