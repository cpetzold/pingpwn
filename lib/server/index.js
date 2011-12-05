var path = require('path'),
    express = require('express'),
    derby = require('derby'),
    gzip = require('connect-gzip'),
    app = require('../app');

var root = path.dirname(path.dirname(__dirname)),
    publicPath = path.join(root, 'public'),
    staticPages = derby.createStatic(root);
    
var server = express.createServer(),
    store = app.createStore({ redis: { db: 1 }, listen: server });

store.flush();

server
  .use(gzip.staticGzip(publicPath, { max_age: 99999 }))
  .use(express.favicon())
  .use(express.bodyParser())
  .use(express.methodOverride())
  .use(express.cookieParser())
  .use(express.session({ secret: 'pwn', cookie: { max_age: 99999 }}))
  .use(app.session())
  .use(gzip.gzip())
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


server.listen(3000);
console.log('Express server started in %s mode', server.settings.env);
console.log('Go to: http://localhost:%d/', server.address().port);
