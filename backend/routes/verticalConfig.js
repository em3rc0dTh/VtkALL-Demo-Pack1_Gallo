import express from 'express';
import { getSafePublicVerticalConfig } from '../services/verticalConfigService.js';

const router = express.Router();

router.get('/', (req, res) => {
  res.json({
    ok: true,
    config: getSafePublicVerticalConfig()
  });
});

export default router;
