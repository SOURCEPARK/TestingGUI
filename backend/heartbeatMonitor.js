import db from './config/db.js';

export function startHeartbeatMonitor() {
  setInterval(async () => {
    const fifteenMinutesAgo = Date.now() - 15 * 60 * 1000;
    try {
      const result = await db.query(`
        SELECT id, active_test FROM test_runners 
        WHERE (last_heartbeat < $1 OR last_heartbeat IS NULL) AND status != 'ERROR'
      `, [fifteenMinutesAgo]);

      console.log({ fifteenMinutesAgo, runners: result.rows });

      console.log('Testing for overdue Heartbeats')

      for (const runner of result.rows) {
        await db.query(`UPDATE test_runners SET status = 'ERROR' WHERE id = $1`, [runner.id]);

        console.log(`Runner ${runner.id} auf ERROR gesetzt`);

        if (runner.active_test) {
          await db.query(`
            UPDATE tests 
            SET status = 'FAILED', error_code = '503', error_text = 'No heartbeat received for 15min.'
            WHERE id = $1 OR testrun_id = $1
          `, [runner.active_test]);

          console.log(`${runner.active_test} auf FAILED gesetzt, da Runner nicht erreichbar ist`);

        }

      }
    } catch (err) {
      console.error('Heartbeat-Überprüfung fehlgeschlagen:', err);
    }
  }, 5 * 60 * 1000);
}