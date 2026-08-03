import { Router } from 'express';
import { notificationController } from '../controllers/notifications.controller';

const router = Router();

router.get('/', notificationController.list);
router.get('/:id', notificationController.getById);
router.post('/', notificationController.create);
router.put('/:id', notificationController.replace);
router.patch('/:id', notificationController.update);
router.delete('/:id', notificationController.delete);

export default router;
