import { z } from "zod";

export const updatePrivacyPolicySchema = z.object({
  dataCollectionUserProvided: z.string().min(10).optional(),
  dataCollectionAutomatic: z.string().min(10).optional(),
  dataCollectionThirdParty: z.string().min(10).optional(),
  dataUsageDescription: z.string().min(10).optional(),
  dataSharingDescription: z.string().min(10).optional(),
  dataSharingImportantNote: z.string().min(10).optional(),
  securityMeasures: z.string().min(10).optional(),
  securityDisclaimer: z.string().min(10).optional(),
  dataRetentionDescription: z.string().min(10).optional(),
  lgpdRightsDescription: z.string().min(10).optional(),
  lgpdContactInfo: z.string().min(10).optional(),
  minorsPolicy: z.string().min(10).optional(),
  internationalTransfers: z.string().min(10).optional(),
  accountDeletionDescription: z.string().min(10).optional(),
  accountDeletionProcess: z.string().min(10).optional(),
  dpoName: z.string().min(2).optional(),
  dpoEmail: z.string().email().optional(),
  dpoContactPage: z.string().min(5).optional(),
  changeDescription: z.string().min(10).max(500).optional(),
});
