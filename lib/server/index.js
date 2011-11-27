var path = require('path'),
    express = require('express'),
    derby = require('derby'),
    everyauth = require('everyauth'),
    gzip = require('connect-gzip'),
    config = require('../config'),
    app = require('../app');

var root = path.dirname(path.dirname(__dirname)),
    publicPath = path.join(root, 'public'),
    staticPages = derby.createStatic(root);
    
var server = express.createServer(),
    store = app.createStore({ redis: { db: 1 }, listen: server });

store.flush();
app.model = store.createModel();

everyauth.facebook
  .appId(config.id)
  .appSecret(config.secret)
  .findOrCreateUser(function(session, token, extra, fbUser) {
    var player = app.players.get(app.model.get('players'), fbUser.id);

    if (!player) {
      var promise = this.Promise();
      app.model.push('players', {
        id: fbUser.id,
        username: fbUser.username,
        name: fbUser.name,
        rating: 1200,
        games: 0,
        wins: 0,
        losses: 0
      }, function(e, player) {
        promise.fulfill(player);
      });
      return promise;
    } else {
      return player; 
    }
  })
  .redirectPath('/');

server
  .use(gzip.staticGzip(publicPath, { max_age: 99999 }))
  .use(express.favicon())
  .use(express.bodyParser())
  .use(express.methodOverride())
  .use(express.cookieParser())
  .use(express.session({ secret: 'pwn', cookie: { max_age: 99999 }}))
  .use(app.session())
  .use(gzip.gzip())
  .use(everyauth.middleware())
  .use(app.router())
  .use(server.router);

everyauth.helpExpress(server);

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
