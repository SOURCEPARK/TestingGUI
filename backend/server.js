import express, { json } from 'express';
const app = express();
import testRoutes from './Routes/test';
import testRunnerRoutes from './Routes/testRunner';

app.use(json());
app.use('/test', testRoutes);
app.use('/tests', testRoutes);
app.use('/available-tests', testRoutes);
app.use('/test-runner', testRunnerRoutes);
app.use('/test-runners', testRunnerRoutes); // plural alias


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});