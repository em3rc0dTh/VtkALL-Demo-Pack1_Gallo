import { Router } from 'express';
import { catalogOfferingController } from '../controllers/catalogOfferings.controller';
import { referenceAdminWriteMiddleware } from '../middleware/referenceAdminWrite.middleware';

const router = Router();

router.use(referenceAdminWriteMiddleware);
router.get('/', catalogOfferingController.list);
router.get('/:id', catalogOfferingController.getById);
router.post('/', catalogOfferingController.create);
router.put('/:id', catalogOfferingController.replace);
router.patch('/:id', catalogOfferingController.update);
router.delete('/:id', catalogOfferingController.delete);

export default router;
