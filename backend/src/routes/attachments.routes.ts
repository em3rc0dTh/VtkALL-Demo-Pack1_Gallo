import { Router } from 'express';
import { attachmentController } from '../controllers/attachments.controller';

const router = Router();

router.get('/', attachmentController.list);
router.get('/:id', attachmentController.getById);
router.post('/', attachmentController.create);
router.put('/:id', attachmentController.replace);
router.patch('/:id', attachmentController.update);
router.delete('/:id', attachmentController.delete);

export default router;
