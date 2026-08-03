import swaggerJsdoc from 'swagger-jsdoc';
import { generatedPaths } from '../docs/openapi';

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
    paths: generatedPaths
  },
  apis: ['./src/routes/*.ts'], // Generate from routing files if JSDoc is present
};

export const swaggerSpec = swaggerJsdoc(options);
