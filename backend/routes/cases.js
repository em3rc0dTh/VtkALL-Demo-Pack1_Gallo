import express from 'express';
import { protegerRuta } from '../middleware/auth.js';
import { createCase, getCaseById, listCases, updateCaseStatus, CaseServiceError } from '../services/caseService.js';

const router = express.Router();

const handleCaseError = (res, error) => {
  if (error instanceof CaseServiceError) {
    return res.status(error.statusCode).json({
      ok: false,
      error: error.message
    });
  }

  console.error('Case route error:', error);
  return res.status(500).json({
    ok: false,
    error: 'Case service error'
  });
};

router.get('/', protegerRuta, async (req, res) => {
  try {
    const data = await listCases(req.query);
    res.json({ ok: true, data });
  } catch (error) {
    handleCaseError(res, error);
  }
});

router.post('/', protegerRuta, async (req, res) => {
  try {
    const data = await createCase(req.body);
    res.status(201).json({ ok: true, data });
  } catch (error) {
    handleCaseError(res, error);
  }
});

router.get('/:id', protegerRuta, async (req, res) => {
  try {
    const data = await getCaseById(req.params.id);
    res.json({ ok: true, data });
  } catch (error) {
    handleCaseError(res, error);
  }
});

router.patch('/:id/status', protegerRuta, async (req, res) => {
  try {
    const data = await updateCaseStatus(req.params.id, req.body?.status);
    res.json({ ok: true, data });
  } catch (error) {
    handleCaseError(res, error);
  }
});

export default router;
