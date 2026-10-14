const { config } = require('./config');
const { pool } = require('./event_db');
module.exports = function start(app) {
  const server = app.listen(config.port, config.host, () => {
    console.log('Harbour Hope listening on port ' + server.address().port);
  });
  server.on('error', error => { console.error('Server startup failed:', error.code || error.name); process.exitCode = 1; });
  let stopping = false;
  const stop = () => {
    if (stopping) return;
    stopping = true;
    const timeout = setTimeout(() => process.exit(1),10000); timeout.unref();
    server.close(async () => {
      try { await pool.end(); process.exitCode = 0; }
      catch { process.exitCode = 1; }
      clearTimeout(timeout);
    });
  };
  process.once('SIGTERM',stop); process.once('SIGINT',stop);
  return server;
};
