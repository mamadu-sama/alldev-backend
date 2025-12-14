import { Router } from 'express';
import { ContactController } from '@/controllers/contact.controller';
import { validate } from '@/middleware/validate.middleware';
import { contactRateLimiter } from '@/middleware/rateLimiter.middleware';
import { contactSchema } from '@/schemas/contact.schema';

const router = Router();

// Public route with strict rate limiting
router.post(
  '/',
  contactRateLimiter,
  validate(contactSchema),
  ContactController.createContact
);

export default router;

