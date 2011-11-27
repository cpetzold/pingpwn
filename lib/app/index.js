var app = require('derby').createApp(module),
    players = require('./players');

exports.players = players;

app.get('/', function(page, model, params) {
  var session = page.res.req.session;
  
  if (!session.auth || !session.auth.loggedIn) {
    return page.redirect('/auth/facebook');
  }

  var user = players.get(app.model.get('players'), session.auth.facebook.user.id).player;

  model.subscribe('*', function() {
    console.log(user);
    page.render({
      user: user
    });
  });
});

app.post('/game', function(page, model, params) {
  var params = params.body;
  console.log('new game', params);

  var list = model.get('players')
    , winner = players.get(list, params.winner)
    , loser = players.get(list, params.loser)
    , error = false;

  if (!loser) {
    var $help = $('<span>');
    $help.addClass('help-inline').text(params.loser + ' is not a player');
    $('#newGameLoser').parents('.clearfix').addClass('error');
    $('#newGameLoser').addClass('error').after($help).focus();
    return;
  }

  model.push('games', {
      date: new Date
    , winner: winner.player.id
    , winnerPoints: params.winnerPoints
    , loser: loser.player.id
    , loserPoints: params.loserPoints
  }, function(e, game) {

    var k = 25
      , winnerExpected = 1 / (1 + Math.pow(10, ((loser.player.rating - winner.player.rating) / 400)))
      , loserExpected = 1 / (1 + Math.pow(10, ((winner.player.rating - loser.player.rating) / 400)))
      , winnerChange = k * (1 - winnerExpected)
      , loserChange = k * (0 - loserExpected);
    
    model.incr('players.' + winner.i + '.games');
    model.incr('players.' + winner.i + '.wins');
    model.incr('players.' + winner.i + '.rating', winnerChange);

    model.incr('players.' + loser.i + '.games');
    model.incr('players.' + loser.i + '.losses');
    model.incr('players.' + loser.i + '.rating', loserChange);
    
    page.redirect('/');
  });
});


function setIndexes() {
  $('#playerRows tr').each(function(i, el) {
    var $el = $(el);
    $el.children().first().html($el.index()+1);
  });
}

app.ready(function(model) {
  
  setIndexes();

  var playerNames = model.get('players');
  playerNames = playerNames.map(function(p) { return p.name; });

  $('#newGameLoser').autocomplete(playerNames);
  
});
