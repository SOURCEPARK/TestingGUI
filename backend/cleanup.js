/**
 * @file cleanup.js
 * This module provides functionality to clean up old test runners from the database.
 * It defines a function to remove runners that have not sent a heartbeat within a specified threshold,
 * and a function to start a periodic cleanup job.
 */
export const DEFAULT_THRESHOLD_MS = 48 * 60 * 60 * 1000; // 48 hours
export const DEFAULT_INTERVAL_MS = 60 * 60 * 1000; // run hourly

export async function cleanupOldRunners(dbConn, thresholdMs = DEFAULT_THRESHOLD_MS, nowMs = Date.now()) {
    if (!dbConn) {
        const mod = await import('./config/db.js');
        dbConn = mod.default;
    }
    const cutoff = nowMs - thresholdMs;
    await dbConn.query('   DELETE FROM test_runners    WHERE last_heartbeat < $1    AND id NOT IN (SELECT DISTINCT test_runner_id FROM tests WHERE test_runner_id IS NOT NULL)', [cutoff]);
}

export function startCleanupJob(dbConn, thresholdMs = DEFAULT_THRESHOLD_MS, intervalMs = DEFAULT_INTERVAL_MS) {
    const run = () => cleanupOldRunners(dbConn, thresholdMs).catch(err => console.error('Cleanup job failed:', err));
    run();
    setInterval(run, intervalMs);
}
