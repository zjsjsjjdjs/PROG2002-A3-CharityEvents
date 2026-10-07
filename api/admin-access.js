const { createHash, timingSafeEqual } = require('node:crypto');
const digest = value => createHash('sha256').update(value).digest();
function adminAccess(config) {
  return (req,res,next) => {
    res.setHeader('Cache-Control','no-store');
    const expectedOrigin = config.publicOrigin || req.protocol + '://' + req.get('host');
    if (!['GET','HEAD','OPTIONS'].includes(req.method) &&
        ((req.get('origin') && req.get('origin') !== expectedOrigin) || req.get('sec-fetch-site') === 'cross-site')) {
      return res.status(403).json({code:'CROSS_SITE_ADMIN_REQUEST',message:'Open the admin page on the application domain before making changes.'});
    }
    if (!config.adminUser) {
      const localAddress = ['127.0.0.1','::1','::ffff:127.0.0.1'].includes(req.socket.remoteAddress);
      let localHost = false;
      try { localHost = ['127.0.0.1','localhost','[::1]'].includes(new URL('http://' + req.get('host')).hostname); } catch {}
      if (!config.production && localAddress && localHost) return next();
      return res.status(503).json({code:'ADMIN_NOT_CONFIGURED',message:'Administrator access has not been configured.'});
    }
    const match = /^Basic ([A-Za-z0-9+/]+=*)$/i.exec(req.get('authorization') || '');
    const supplied = match ? Buffer.from(match[1],'base64').toString('utf8') : '';
    if (!timingSafeEqual(digest(supplied),digest(config.adminUser + ':' + config.adminPassword))) {
      res.setHeader('WWW-Authenticate','Basic realm="Harbour Hope administration", charset="UTF-8"');
      return res.status(401).json({code:'ADMIN_AUTH_REQUIRED',message:'Sign in with the administrator account.'});
    }
    next();
  };
}
module.exports = { adminAccess };
