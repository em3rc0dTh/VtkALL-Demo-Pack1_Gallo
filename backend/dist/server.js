"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const env_1 = require("./config/env");
const connect_1 = require("./db/connect");
const hermesInferenceRuntime_service_1 = require("./agent/hermes/model/hermesInferenceRuntime.service");
const hermesOperationalConfig_service_1 = require("./agent/hermes/operational/hermesOperationalConfig.service");
const startServer = async () => {
    (0, hermesOperationalConfig_service_1.validateHermesOperationalConfig)();
    await (0, connect_1.connectDB)();
    app_1.default.listen(env_1.env.port, () => {
        console.log(`API running on http://localhost:${env_1.env.port}/api/v1`);
        console.log(`Swagger Docs available at http://localhost:${env_1.env.port}/api-docs`);
        void (0, hermesInferenceRuntime_service_1.warmUpConfiguredModel)();
    });
};
startServer();
