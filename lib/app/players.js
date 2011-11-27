module.exports = {

  sort: function(a, b) {
    return b.rating - a.rating;
  },

  get: function(players, id) {
    if (!players) {
      return false;
    }

    for (var i = 0; i < players.length; i++) {
      if (players[i].id == id || players[i].name == id) {
        return { i: i, player: players[i] };
      }
    }
    return false;
  }

};
