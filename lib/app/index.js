var app = require('derby').createApp(module);

app.get('/', function(page, model, params) {
  model.set('title', 'Ladder');
  model.setNull('players', []);

  model.subscribe('*', function() {
    page.render();
  });
});

app.post('/player', function(page, model, params) {
  var players = model.get('players')
    , player = {
          name: params.body.name
        , score: Math.round(1600 * Math.random())
        , wins: 0
        , losses: 0
      };

  if (!getPlayer(players, player.name)) {
    var position = getPosition(players, player);
    player.position = position + 1;
    
    var l = model.push('players', player);
    model.move('players', l - 1, position);
  }

  page.redirect('/');
});

function getPlayer(players, name) {
  for (var i = 0; i < players.length; i++) {
    if (players[i].name == name) return players[i];
  }
  return false;
}

function getPosition(players, player) {
  for (var i = 0; i < players.length; i++) {
    if (player.score > players[i].score) {
      return i; 
    }    
  }
  return players.length;
}

function setIndexes() {
  $('#playerRows tr').each(function(el) {
    console.log(el);
  });
}
  

app.view.after('players', function(c) {
  $('#newPlayerName').val('');
  setIndexes();
});

app.ready(function(model) {
  
  setIndexes();

});
