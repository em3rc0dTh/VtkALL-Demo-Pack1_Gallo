"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const openapi_1 = require("./config/openapi");
const routes_1 = __importDefault(require("./routes"));
const demoTest_routes_1 = __importDefault(require("./routes/demoTest.routes"));
const demoTestError_middleware_1 = require("./middleware/demoTestError.middleware");
const executionContext_middleware_1 = require("./middleware/executionContext.middleware");
const app = (0, express_1.default)();
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: true,
    allowedHeaders: [
        'Content-Type',
        'Idempotency-Key',
        'X-Correlation-Id',
        'X-Causation-Id',
        'X-Actor-Id',
        'X-Actor-Name',
        'X-Demo-Test-Admin-Token',
    ],
    exposedHeaders: ['X-Correlation-Id', 'X-Causation-Id', 'Idempotency-Key', 'X-Demo-Test-Admin-Token'],
}));
app.use(express_1.default.json());
app.use((0, morgan_1.default)('dev'));
app.use('/api-docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(openapi_1.swaggerSpec));
app.get('/openapi.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(openapi_1.swaggerSpec);
});
app.use('/api/demo-test', executionContext_middleware_1.executionContextMiddleware, demoTest_routes_1.default, demoTestError_middleware_1.demoTestErrorMiddleware);
app.use('/api/v1', executionContext_middleware_1.executionContextMiddleware, routes_1.default, demoTestError_middleware_1.demoTestErrorMiddleware);
app.use((err, req, res, next) => {
    console.error(err);
    res.status(err.status || 500).json({ error: { code: 'INTERNAL_ERROR', message: err.message || 'Internal Server Error' } });
});
exports.default = app;
