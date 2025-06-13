export const DEFAULT_THRESHOLD_MS = 48 * 60 * 60 * 1000; // 48 hours
export const DEFAULT_INTERVAL_MS = 60 * 60 * 1000; // run hourly

export async function cleanupOldRunners(dbConn, thresholdMs = DEFAULT_THRESHOLD_MS, nowMs = Date.now()) {
    if (!dbConn) {
        const mod = await import('./config/db.js');
        dbConn = mod.default;
    }
    const cutoff = nowMs - thresholdMs;
    await dbConn.query('DELETE FROM test_runners WHERE last_heartbeat < $1', [cutoff]);
}

export function startCleanupJob(dbConn, thresholdMs = DEFAULT_THRESHOLD_MS, intervalMs = DEFAULT_INTERVAL_MS) {
    const run = () => cleanupOldRunners(dbConn, thresholdMs).catch(err => console.error('Cleanup job failed:', err));
    run();
    setInterval(run, intervalMs);
}