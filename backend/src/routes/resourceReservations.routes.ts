import { Router } from 'express';
import { resourceReservationController } from '../controllers/resourceReservations.controller';

const router = Router();

router.get('/', resourceReservationController.list);
router.get('/:id', resourceReservationController.getById);
router.post('/', resourceReservationController.create);
router.put('/:id', resourceReservationController.replace);
router.patch('/:id', resourceReservationController.update);
router.delete('/:id', resourceReservationController.delete);

export default router;
