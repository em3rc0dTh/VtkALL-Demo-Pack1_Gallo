import { Router } from 'express';
import { workTeamScheduleRuleController } from '../controllers/workTeamScheduleRules.controller';

const router = Router();

router.get('/', workTeamScheduleRuleController.list);
router.get('/:id', workTeamScheduleRuleController.getById);
router.post('/', workTeamScheduleRuleController.create);
router.put('/:id', workTeamScheduleRuleController.replace);
router.patch('/:id', workTeamScheduleRuleController.update);
router.delete('/:id', workTeamScheduleRuleController.delete);

export default router;
