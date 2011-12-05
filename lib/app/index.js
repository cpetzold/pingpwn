var app = require('derby').createApp(module),
    players = require('./players');

exports.players = players;

app.get('/', function(page, model, params) {
  model.set('_title', 'Standings');

  model.subscribe('*', function() {
    model.setNull('players', []);
    model.setNull('games', []);

    page.render();
  });
});

app.post('/player', function(page, model, params) {
  window.history.replaceState({}, '', '/');
  clearErrors();
  var params = params.body;

  var list = model.get('players')
    , exists = players.get(list, params.name);

  if (exists) {
    return formError('#newPlayerName', 'User already exists');
  }

  model.push('players', {
      name: params.name
    , rating: 1200
    , games: 0
    , wins: 0
    , losses: 0
  });

  page.render();
  setAutocomplete(model.get('players'));
});

app.post('/game', function(page, model, params) {
  model.set('_title', 'Add a game');
  window.history.replaceState({}, '', '/');
  clearErrors();
  var params = params.body;

  var list = model.get('players')
    , winner = players.get(list, params.winner)
    , loser = players.get(list, params.loser)
    , error = false;

  if (!winner) {
    formError('#newGameWinner', 'User doesn\'t exist');
    error = true;
  }

  if (!loser) {
    formError('#newGameLoser', 'User doesn\'t exist');
    error = true;
  }

  if (error) {
    return;
  }

  model.push('games', {
      date: new Date
    , winner: winner.player.name
    , winnerPoints: params.winnerPoints
    , loser: loser.player.name
    , loserPoints: params.loserPoints
  }, function(e, game) {

    var k = 25
      , winnerExpected = 1 / (1 + Math.pow(10, ((loser.player.rating - winner.player.rating) / 400)))
      , loserExpected = 1 / (1 + Math.pow(10, ((winner.player.rating - loser.player.rating) / 400)))
      , winnerChange = Math.round(k * (1 - winnerExpected))
      , loserChange = Math.round(k * (0 - loserExpected));
    
    model.incr('players.' + winner.i + '.games');
    model.incr('players.' + winner.i + '.wins');
    model.incr('players.' + winner.i + '.rating', winnerChange);

    model.incr('players.' + loser.i + '.games');
    model.incr('players.' + loser.i + '.losses');
    model.incr('players.' + loser.i + '.rating', loserChange);

    page.render();
  });
});

function clearErrors() {
  $('.help-inline').remove();
  $('.error').removeClass('error');
}

function formError(selector, message) {
  var $input = $(selector)
    , $help = $('<span>');

  $help.addClass('help-inline').text(message);
  $input.parents('.clearfix').addClass('error');
  $input.addClass('error').after($help).focus();
}

function setIndexes() {
  $('#playerRows tr').each(function(i, el) {
    var $el = $(el);
    $el.children().first().html($el.index()+1);
  });
}

function setAutocomplete(players) {
  if (players) {
    players = players.map(function(p) { return p.name; });
    $('.playerName').autocomplete(players);
  }
}

app.view.after('standings', function(context) {
  setIndexes();
});

app.ready(function(model) {
  setIndexes();
  setAutocomplete(model.get('players'));

  $(document).bind('keyup', 'p', function() {
    $('.modal-backdrop').click();
    $('#addPlayerButton').click();
  });

  $(document).bind('keyup', 'g', function() {
    $('.modal-backdrop').click();
    $('#addGameButton').click();
  });

  $(document).bind('keyup', 'esc', function() {
    $('.modal-backdrop').click();
  });

  $('#addPlayer').live('shown', function() {
    model.set('_title', 'Add a player');
    $('#newPlayerName').focus();
  });

  $('#addGame').live('shown', function() {
    model.set('_title', 'Add a game');
    $('#newGameWinner').focus();
  });
});
