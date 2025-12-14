import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import postRoutes from './post.routes';
import tagRoutes from './tag.routes';
import commentRoutes from './comment.routes';
import voteRoutes from './vote.routes';
import notificationRoutes from './notification.routes';
import searchRoutes from './search.routes';
import reportRoutes from './report.routes';
import moderationRoutes from './moderation.routes';
import adminRoutes from './admin.routes';
import contactRoutes from './contact.routes';

const router = Router();

// Mount routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/posts', postRoutes);
router.use('/tags', tagRoutes);
router.use('/', commentRoutes); // Comments are under /posts/:postId/comments
router.use('/', voteRoutes);
router.use('/', notificationRoutes);
router.use('/', searchRoutes);
router.use('/', reportRoutes);
router.use('/', moderationRoutes);
router.use('/', adminRoutes);
router.use('/contact', contactRoutes);

export default router;

