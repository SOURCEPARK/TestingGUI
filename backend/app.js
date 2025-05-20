import express from 'express';
import timeRoutes from './routes/time.js';
import testRoutes from './routes/test.js';
import testRunnerRoutes from './routes/testRunner.js';

const app = express();

app.use(express.json());
app.use('/', timeRoutes);
app.use('/test', testRoutes);
app.use('/test-runner', testRunnerRoutes);

export default app;