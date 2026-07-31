import { Router } from 'express';
import { businessProfileController } from '../controllers/businessProfiles.controller';
import { referenceAdminWriteMiddleware } from '../middleware/referenceAdminWrite.middleware';

const router = Router();

router.use(referenceAdminWriteMiddleware);
router.get('/', businessProfileController.list);
router.get('/:id', businessProfileController.getById);
router.post('/', businessProfileController.create);
router.put('/:id', businessProfileController.replace);
router.patch('/:id', businessProfileController.update);
router.delete('/:id', businessProfileController.delete);

export default router;
