import { z } from "zod";

export const updateCookiePolicySchema = z.object({
  introduction: z.string().min(10).optional(),
  whatAreCookiesDescription: z.string().min(10).optional(),
  similarTechnologies: z.string().min(10).optional(),
  whyWeUseCookies: z.string().min(10).optional(),
  essentialCookiesDescription: z.string().min(10).optional(),
  functionalCookiesDescription: z.string().min(10).optional(),
  analyticsCookiesDescription: z.string().min(10).optional(),
  marketingCookiesDescription: z.string().min(10).optional(),
  marketingNote: z.string().min(10).optional(),
  cookieDurationDescription: z.string().min(10).optional(),
  manageCookiesAlldev: z.string().min(10).optional(),
  manageCookiesBrowser: z.string().min(10).optional(),
  manageCookiesThirdParty: z.string().min(10).optional(),
  manageCookiesWarning: z.string().min(10).optional(),
  updatesDescription: z.string().min(10).optional(),
  contactEmail: z.string().email().optional(),
  contactPage: z.string().min(5).optional(),
  changeDescription: z.string().min(10).max(500).optional(),
});
