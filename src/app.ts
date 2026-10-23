import express from 'express';
import { corsConfig, rateLimiter } from './middlewares/security.middleware';
import douRoutes from './routes/dou.routes';

const app = express();

app.use(corsConfig);
app.use(express.json());
app.use('/api', rateLimiter); // O limitador de taxa protege tudo que começa com /api

app.use('/api', douRoutes);

export default app;