import express from 'express';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import testRoutes from './routes/testRoutes.js';
import timeRoutes from './routes/timeRoutes.js';
import testRunnerRoutes from './routes/testRunnerRoutes.js';

dotenv.config();

const app = express();
app.use(bodyParser.json());

app.use('/test', testRoutes);
app.use('/time', timeRoutes);
app.use('/test-runner', testRunnerRoutes);

export default app;