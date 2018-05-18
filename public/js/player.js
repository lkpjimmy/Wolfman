function addPlayer(name) {
  if (name == "") {
    vibrateElement($('#login-name'));
    return;
  }

  var isAlived = true;
  var isNextRoundAlived = true;
  var player = new Player(name, isAlived, isNextRoundAlived);

  socket.emit('add_player', {
      name: player["name"],
      isAlived: player["isAlived"],
      isNextRoundAlived: player["isNextRoundAlived"]
  });

  fadeOutFadeIn ($('#login-page'), $('#room-list'));
}

function updatePlayerList(playerList) {
  localPlayerList = [];
  $('#player-container').empty();

  $.each(playerList, function(key, value) {
    var player = new Player(value["name"], value["isAlived"], value["isNextRoundAlived"]);
    localPlayerList.push(player);

    if (player.isAlived == true) {
      var string = "<div class=\"player\" id=\"" + key + "\"><img class=\"alive\" src=\"assets/player_white.png\"><br>" + value["name"] + "</div>";
    }
    else {
      var string = "<div class=\"player\" id=\"" + key + "\"><img class=\"dead\" src=\"assets/player_black.png\"><br>" + value["name"] + "</div>";
    }
    $('#player-container').append(string);
  });
}

socket.on('update_player_list', function(playerList) {
  updatePlayerList(playerList);
  $('#player-container').fadeTo(0, 1.0);
  $('#player-container').fadeIn(1000);
  $('#chatroom').fadeIn(1000);
});
