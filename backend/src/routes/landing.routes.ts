import { Router } from 'express';
import { referenceAdminWriteMiddleware } from '../middleware/referenceAdminWrite.middleware';
import {
  publishAdminLandingPage,
  readAdminLandingPage,
  readPublicLandingPage,
  restoreAdminLandingPage,
  updateAdminLandingDraft,
  uploadAdminLandingAsset,
} from '../controllers/landing.controller';

const router = Router();

router.get('/public/landing-pages/:businessSlug/:pageSlug', readPublicLandingPage);

router.get('/admin/landing-pages/:businessSlug/:pageSlug', readAdminLandingPage);
router.post('/admin/landing-assets', referenceAdminWriteMiddleware, uploadAdminLandingAsset);
router.patch('/admin/landing-pages/:businessSlug/:pageSlug', referenceAdminWriteMiddleware, updateAdminLandingDraft);
router.post('/admin/landing-pages/:businessSlug/:pageSlug/publish', referenceAdminWriteMiddleware, publishAdminLandingPage);
router.post('/admin/landing-pages/:businessSlug/:pageSlug/versions/:version/restore', referenceAdminWriteMiddleware, restoreAdminLandingPage);

export default router;
