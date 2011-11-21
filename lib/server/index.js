var path = require('path'),
    express = require('express'),
    derby = require('derby'),
    gzip = require('connect-gzip'),
    app = require('../app');

var MAX_AGE_ONE_YEAR = { maxAge: 1000 * 60 * 60 * 24 * 365 },
    root = path.dirname(path.dirname(__dirname)),
    publicPath = path.join(root, 'public'),
    staticPages = derby.createStatic(root),
    server, store;

(server = express.createServer())
  .use(gzip.staticGzip(publicPath, MAX_AGE_ONE_YEAR))
  .use(express.favicon())
  .use(express.bodyParser())
  .use(express.methodOverride())

  .use(express.cookieParser())
  // .use(express.session({ secret: '', cookie: MAX_AGE_ONE_YEAR }))
  // .use(app.session())

  // Remove to disable dynamic gzipping
  .use(gzip.gzip())

  // The router method creates an express middleware from the app's routes
  .use(app.router())
  .use(server.router);

server.configure('development', function() {
  server.error(function(err, req, res, next) {
    if (err) console.log(err.stack ? err.stack : err);
    next(err);
  });
});

server.error(function(err, req, res) {
  var message = err.message || err.toString(),
      status = parseInt(message);
  if (status === 404) {
    staticPages.render('404', res, {url: req.url}, 404);
  } else {
    res.send( ((status >= 400) && (status < 600)) ? status : 500 );
  }
});

server.all('*', function(req) {
  throw '404: ' + req.url;
});

store = app.createStore({ redis: { db: 1 }, listen: server });
store.flush();

server.listen(3000);
console.log('Express server started in %s mode', server.settings.env);
console.log('Go to: http://localhost:%d/', server.address().port);
