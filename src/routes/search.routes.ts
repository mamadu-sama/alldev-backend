import { Router } from 'express';
import { SearchController } from '@/controllers/search.controller';

const router = Router();

// Global search (public, but returns more info if authenticated)
router.get('/search', SearchController.searchGlobal);

// Search posts (public)
router.get('/search/posts', SearchController.searchPosts);

// Autocomplete (public)
router.get('/search/autocomplete', SearchController.autocomplete);

export default router;


