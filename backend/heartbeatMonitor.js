import db from './config/db.js';

export function startHeartbeatMonitor() {
  setInterval(async () => {
    const fifteenMinutesAgo = Date.now() - 15 * 60 * 1000;
    try {
      const result = await db.query(`
        SELECT id, active_test FROM test_runners 
        WHERE (last_heartbeat < $1 OR last_heartbeat IS NULL) AND status != 'ERROR'
      `, [fifteenMinutesAgo]);
      console.log('Testing for overdue Heartbeats')

      for (const runner of result.rows) {
        await db.query(`UPDATE test_runners SET status = 'ERROR' WHERE id = $1`, [runner.id]);

        if (runner.active_test) {
          await db.query(`
            UPDATE tests 
            SET status = 'FAILED', last_message = 'No heartbeat for 15 min.'
            WHERE testrun_id = $1
          `, [runner.active_test]);
        }

        console.log(`Runner ${runner.id} auf ERROR gesetzt, Test ggf. auf FAILED.`);
      }
    } catch (err) {
      console.error('Heartbeat-Überprüfung fehlgeschlagen:', err);
    }
  }, 5 * 60 * 1000);
}