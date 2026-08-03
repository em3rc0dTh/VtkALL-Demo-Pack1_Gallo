import { Router } from 'express';
import { appointmentController } from '../controllers/appointments.controller';

const router = Router();

router.get('/', appointmentController.list);
router.get('/:id', appointmentController.getById);
router.post('/', appointmentController.create);
router.put('/:id', appointmentController.replace);
router.patch('/:id', appointmentController.update);
router.delete('/:id', appointmentController.delete);

export default router;
