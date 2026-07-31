import { Router } from 'express';
import { customerInteractionController } from '../controllers/customerInteractions.controller';

const router = Router();

router.get('/', customerInteractionController.list);
router.get('/:id', customerInteractionController.getById);
router.post('/', customerInteractionController.create);
router.put('/:id', customerInteractionController.replace);
router.patch('/:id', customerInteractionController.update);
router.delete('/:id', customerInteractionController.delete);

export default router;
