import { Router } from 'express';
import { timelineEventController } from '../controllers/timelineEvents.controller';

const router = Router();

router.get('/', timelineEventController.list);
router.get('/:id', timelineEventController.getById);
router.post('/', timelineEventController.create);
router.put('/:id', timelineEventController.replace);
router.patch('/:id', timelineEventController.update);
router.delete('/:id', timelineEventController.delete);

export default router;
