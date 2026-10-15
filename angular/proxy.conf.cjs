// Keep the browser Host header: the API validates same-origin admin writes.
// API_PROXY_TARGET is for local development only, never a browser credential.
module.exports = {
  '/api/**': {
    target: process.env.API_PROXY_TARGET || 'http://127.0.0.1:3000',
    changeOrigin: false,
  },
};
