const app = require("./src/app");
const { init } = require('./src/models');

const APP_PORT = process.env.PORT || 4000;

// Initialize DB (authenticate and sync) before starting the server
init()
  .then(() => {
    app.listen(APP_PORT, () => {
      console.log(`App is listening on port ${APP_PORT}`);
    });
  })
  .catch(err => {
    console.error('Failed to start server:', err.message || err);
    process.exit(1);
  });
