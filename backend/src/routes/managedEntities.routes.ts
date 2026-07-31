import { Router } from 'express';
import { managedEntityController } from '../controllers/managedEntities.controller';

const router = Router();

router.get('/', managedEntityController.list);
router.get('/:id', managedEntityController.getById);
router.post('/', managedEntityController.create);
router.put('/:id', managedEntityController.replace);
router.patch('/:id', managedEntityController.update);
router.delete('/:id', managedEntityController.delete);

export default router;
