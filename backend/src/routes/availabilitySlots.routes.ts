import { Router } from 'express';
import { availabilitySlotController } from '../controllers/availabilitySlots.controller';

const router = Router();

router.get('/', availabilitySlotController.list);
router.get('/:id', availabilitySlotController.getById);
router.post('/', availabilitySlotController.create);
router.put('/:id', availabilitySlotController.replace);
router.patch('/:id', availabilitySlotController.update);
router.delete('/:id', availabilitySlotController.delete);

export default router;
