import { Router } from 'express';
import { workTeamController } from '../controllers/workTeams.controller';

const router = Router();

router.get('/', workTeamController.list);
router.get('/:id', workTeamController.getById);
router.post('/', workTeamController.create);
router.put('/:id', workTeamController.replace);
router.patch('/:id', workTeamController.update);
router.delete('/:id', workTeamController.delete);

export default router;
