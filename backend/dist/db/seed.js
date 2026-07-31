"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const connect_1 = require("./connect");
const seed_service_1 = require("../services/seed.service");
const runSeed = async () => {
    await (0, connect_1.connectDB)();
    try {
        await (0, seed_service_1.seedDatabase)(false);
    }
    catch (error) {
        console.error('Seed error:', error);
    }
    finally {
        await (0, connect_1.disconnectDB)();
    }
};
runSeed();
