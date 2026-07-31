import { Router, Request, Response } from 'express';
import { seedDatabase, getSeedStatus } from '../services/seed.service';
import mongoose from 'mongoose';
import { env } from '../config/env';
import { getHermesOperationalReadiness } from '../agent/hermes/operational/hermesOperationalReadiness.service';

const router = Router();

router.get('/health', async (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    databaseName: mongoose.connection.name || 'vtkall_demo_pack_1',
    timestamp: new Date().toISOString()
  });
});

router.get('/hermes/readiness', async (req: Request, res: Response) => {
  const readiness = await getHermesOperationalReadiness();
  res.status(readiness.status === 'not_ready' ? 503 : 200).json(readiness);
});

router.post('/seed', async (req: Request, res: Response) => {
  try {
    const results = await seedDatabase(false);
    res.json({ message: 'Seed completed', results });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/seed/reset', async (req: Request, res: Response) => {
  try {
    const results = await seedDatabase(true);
    res.json({ message: 'Seed reset completed', results });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/seed/status', async (req: Request, res: Response) => {
  try {
    const status = await getSeedStatus();
    res.json(status);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
