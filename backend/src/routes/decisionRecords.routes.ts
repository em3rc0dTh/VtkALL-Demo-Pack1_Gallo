import { Router } from 'express';
import { decisionRecordController } from '../controllers/decisionRecords.controller';

const router = Router();

router.get('/', decisionRecordController.list);
router.get('/:id', decisionRecordController.getById);
router.post('/', decisionRecordController.create);
router.put('/:id', decisionRecordController.replace);
router.patch('/:id', decisionRecordController.update);
router.delete('/:id', decisionRecordController.delete);

export default router;
