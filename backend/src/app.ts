import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/openapi';
import routes from './routes';
import demoTestRoutes from './routes/demoTest.routes';
import { demoTestErrorMiddleware } from './middleware/demoTestError.middleware';
import { executionContextMiddleware } from './middleware/executionContext.middleware';

const app = express();

app.use(helmet());
app.use(cors({
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
app.use(express.json());
app.use(morgan('dev'));

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get('/openapi.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

app.use('/api/demo-test', executionContextMiddleware, demoTestRoutes, demoTestErrorMiddleware);
app.use('/api/v1', executionContextMiddleware, routes, demoTestErrorMiddleware);

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err);
  res.status(err.status || 500).json({ error: { code: 'INTERNAL_ERROR', message: err.message || 'Internal Server Error' } });
});

export default app;
