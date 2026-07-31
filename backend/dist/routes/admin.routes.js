"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const seed_service_1 = require("../services/seed.service");
const mongoose_1 = __importDefault(require("mongoose"));
const hermesOperationalReadiness_service_1 = require("../agent/hermes/operational/hermesOperationalReadiness.service");
const router = (0, express_1.Router)();
router.get('/health', async (req, res) => {
    res.json({
        status: 'ok',
        database: mongoose_1.default.connection.readyState === 1 ? 'connected' : 'disconnected',
        databaseName: mongoose_1.default.connection.name || 'vtkall_demo_pack_1',
        timestamp: new Date().toISOString()
    });
});
router.get('/hermes/readiness', async (req, res) => {
    const readiness = await (0, hermesOperationalReadiness_service_1.getHermesOperationalReadiness)();
    res.status(readiness.status === 'not_ready' ? 503 : 200).json(readiness);
});
router.post('/seed', async (req, res) => {
    try {
        const results = await (0, seed_service_1.seedDatabase)(false);
        res.json({ message: 'Seed completed', results });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
router.post('/seed/reset', async (req, res) => {
    try {
        const results = await (0, seed_service_1.seedDatabase)(true);
        res.json({ message: 'Seed reset completed', results });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
router.get('/seed/status', async (req, res) => {
    try {
        const status = await (0, seed_service_1.getSeedStatus)();
        res.json(status);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.default = router;
