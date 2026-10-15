const apiProxy = require('./proxy.conf.cjs');
// Temporary access to the working registration page while its Angular migration follows.
const target = process.env.API_PROXY_TARGET || 'http://127.0.0.1:3000';
module.exports = {
  ...apiProxy,
  '/register.html': { target, changeOrigin: false },
  '/assets/**': { target, changeOrigin: false },
};
