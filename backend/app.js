import express from 'express';
import time from './routes/time.js';
import test from './routes/test.js';
import testRunner from './routes/testRunner.js';

const app = express();

app.use(express.json());
app.use('/', time);
app.use('/test', test);
app.use('/test-runner', testRunner);

export default app;