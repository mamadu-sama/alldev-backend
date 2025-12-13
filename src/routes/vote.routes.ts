import { Router } from 'express';
import { VoteController } from '@/controllers/vote.controller';
import { authenticate } from '@/middleware/auth.middleware';
import { validate } from '@/middleware/validate.middleware';
import { voteSchema } from '@/schemas/vote.schema';

const router = Router();

// Vote on post or comment (authenticated)
router.post('/votes', authenticate, validate(voteSchema), VoteController.vote);

export default router;


