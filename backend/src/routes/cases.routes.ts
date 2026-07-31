import { Router } from 'express';
import { caseController } from '../controllers/cases.controller';

const router = Router();

router.get('/', caseController.list);
router.get('/:id', caseController.getById);
router.post('/', caseController.create);
router.put('/:id', caseController.replace);
router.patch('/:id', caseController.update);
router.delete('/:id', caseController.delete);

export default router;
