import app from './app.js';
import { startCleanupJob } from './cleanup.js';
import { startHeartbeatMonitor } from './heartbeatMonitor.js';

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server läuft auf http://localhost:${port}`);
});

startCleanupJob();

startHeartbeatMonitor();