import { Router } from 'express';
import { workTeamScheduleOverrideController } from '../controllers/workTeamScheduleOverrides.controller';

const router = Router();

router.get('/', workTeamScheduleOverrideController.list);
router.get('/:id', workTeamScheduleOverrideController.getById);
router.post('/', workTeamScheduleOverrideController.create);
router.put('/:id', workTeamScheduleOverrideController.replace);
router.patch('/:id', workTeamScheduleOverrideController.update);
router.delete('/:id', workTeamScheduleOverrideController.delete);

export default router;
