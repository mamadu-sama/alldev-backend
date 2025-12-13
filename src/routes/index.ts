import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import postRoutes from './post.routes';
import tagRoutes from './tag.routes';

const router = Router();

// Mount routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/posts', postRoutes);
router.use('/tags', tagRoutes);

export default router;

