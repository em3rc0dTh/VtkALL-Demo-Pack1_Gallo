import { Router } from 'express';
import { customerController } from '../controllers/customers.controller';

const router = Router();

router.get('/', customerController.list);
router.get('/:id', customerController.getById);
router.post('/', customerController.create);
router.put('/:id', customerController.replace);
router.patch('/:id', customerController.update);
router.delete('/:id', customerController.delete);

export default router;
