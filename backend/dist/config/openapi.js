"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.swaggerSpec = void 0;
const swagger_jsdoc_1 = __importDefault(require("swagger-jsdoc"));
const openapi_1 = require("../docs/openapi");
const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'VTKALL Demo Pack 1 API',
            version: '1.0.0',
            description: 'API documentation for VTKALL Mock Data Engine',
        },
        servers: [
            {
                url: 'https://bateylate.thradex.com/temotest-api',
                description: 'Production VPS server',
            },
            {
                url: 'http://localhost:4000',
                description: 'Local development server',
            },
        ],
        tags: [
            { name: 'Health' },
            { name: 'Admin Seed' },
            { name: 'Business Profiles' },
            { name: 'Catalog Offerings' },
            { name: 'Customers' },
            { name: 'Managed Entities' },
            { name: 'Cases' },
            { name: 'Customer Interactions' },
            { name: 'Appointments' },
            { name: 'Decision Records' },
            { name: 'Notifications' },
            { name: 'Timeline Events' },
            { name: 'Attachments' },
            { name: 'Availability Slots' },
            { name: 'Work Teams' },
            { name: 'Work Team Schedule Rules' },
            { name: 'Work Team Schedule Overrides' },
            { name: 'Resource Reservations' },
            { name: 'Workflow Data' },
            { name: 'Agent Sim' }
        ],
        paths: openapi_1.generatedPaths
    },
    apis: ['./src/routes/*.ts'], // Generate from routing files if JSDoc is present
};
exports.swaggerSpec = (0, swagger_jsdoc_1.default)(options);
