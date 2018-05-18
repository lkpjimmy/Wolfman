// START GAME
socket.on('start_game', function(playerList) {
  // Important Indicator
  gameStarted = true;

  // WAIT 6 SECS
  setTimeout (function() {
    if (gameStarted == false) {
      return;
    }

    updatePlayerList(playerList);
    $('#play-start-button').hide();
    $('#play-title').show();
    $('#play-title').text("天黑了，請閉眼");

    // EACH PLAYER EMITS ASSIGN POSTS
    socket.emit('assign_posts');
  }, 6000);
});

// EACH PLAYER EMITS GET PLAYER ID
socket.on('get_player_id', function() {
  socket.emit('get_player_id');
});

// GET PLAYER ID
socket.on('get_player_id_finished', function(playerID) {
  myPlayerID = playerID;
});

// ASSIGN POSTS FINISHED
socket.on('assign_posts_finished', function(post) {
  if (gameStarted == false) {
    return;
  }

  // WAIT 3 SECS
  setTimeout(function() {
    if (gameStarted == false) {
      return;
    }

    $('#play-title').text("你是" + post);
    $('#player-container').fadeOut(1000);
    $('#chatroom').fadeOut(1000);
  }, 3000);

  // WAIT 6 SECS (TOTAL)
  setTimeout(function() {
    if (gameStarted == false) {
      return;
    }

    socket.emit('player_turn', "wolfman");
    socket.emit('player_turn', "littlegirl");
  }, 6000);
});

// MC SPEAK
socket.on('mc_speak', function(dialog) {
  if (gameStarted == false) {
    return;
  }

  $('#play-title').text(dialog);
});

/***** DIFFERENT POSTS *****/
socket.on('player_turn', function(post, stillAlived) {
  if (gameStarted == false) {
    return;
  }

  turnActioned = false;
  // WOLFMAN ONLY
  if (post == "wolfman") {
    isWolfmanTurn = true;
  }
  if (post == "wolfman" && stillAlived == false) {
    turnActioned = true;
  }
  $('#player-container').fadeIn(1000);
  $('#chatroom').fadeIn(1000);

  // IF DEAD ALREADY, PASS
  if (post != "wolfman" && post != "hunter" && stillAlived == false) {
    turnActioned = true;

    // WAIT 6 SECS
    setTimeout(function() {
      if (gameStarted == false) {
        return;
      }

      socket.emit('player_action', null);
    }, 6000);
    return;
  }

  $('#player-container').on("click", "div", function(e) {
    if (gameStarted == false || turnActioned == true || localPlayerList[$(this).attr('id')].isAlived == false) {
      return;
    }

    turnActioned = true;
    socket.emit('player_action', $(this).attr('id'));
  });
});

socket.on('player_finished', function(post) {
  if (gameStarted == false) {
    return;
  }

  turnActioned = true;
  isWolfmanTurn = false;

  $('#girl-button').hide();
  $('#player-container').fadeOut(1000);
  $('#chatroom').fadeOut(1000);
});

socket.on('hunter_turn', function() {
  if (gameStarted == false) {
    return;
  }

  socket.emit('player_turn', "hunter");
});

socket.on('show_info_for_littlegirl', function(stillAlived, wolfmanID) {
  if (gameStarted == false || stillAlived == false) {
    return;
  }

  $('#girl-button').show();

  for (var i = 0; i < wolfmanID.length; i++) {
    var id = wolfmanID[i];
    $('#' + id).css("backgroundColor", "#272B2E");
  }
});

function move() {
  stopMoving = false;
  girlClickCount++;
  if (girlClickCount > 9) {
    girlClickCount = 9;
  }

  var elem = document.getElementById("girl-bar");
  var width = 1;
  var id = setInterval(frame, 10);
  function frame() {
    if (width >= 100 || stopMoving == true) {
      clearInterval(id);
      width = 1;
      elem.style.width = width + '%';
      elem.style.backgroundColor = "#4CAF50";
      $('#player-container').hide();
    }
    else {
      width++;
      elem.style.width = width + '%';
      elem.style.backgroundColor = "#4CAF50";

      if (width > (40+girlClickCount)) {
        $('#player-container').fadeTo(0, width/400);
        elem.style.backgroundColor = "yellow";
      }
      if (width > (60-girlClickCount)) {
        $('#player-container').fadeTo(0, width/400);
        elem.style.backgroundColor = "red";

        socket.emit('found_littlegirl', myPlayerID);
      }
    }
  }
}

function stopMove() {
  stopMoving = true;
}
/***** DIFFERENT POSTS *****/

// NEXT POST
socket.on('next_post', function(post) {
  if (gameStarted == false) {
    return;
  }

  socket.emit('player_turn', post);
});

// END ROUND
socket.on('end_round', function() {
  // WAIT 3 SECS
  setTimeout(function() {
    if (gameStarted == false) {
      return;
    }

    socket.emit('end_round');
  }, 3000);
});

/***** ROTING *****/
socket.on('start_roting', function() {
  if (gameStarted == false) {
    return;
  }

  var roted = false;

  $('#player-container').on("click", "div", function(e) {
    if (gameStarted == false || roted == true || localPlayerList[myPlayerID].isAlived == false || localPlayerList[$(this).attr('id')].isAlived == false) {
      return;
    }

    roted = true;
    socket.emit('rote_action', $(this).attr('id'));
  });
});

socket.on('show_who_rote_who', function(roterID, roteeID) {
  if (gameStarted == false) {
    return;
  }

  var roterName = localPlayerList[roterID].name;
  var roteeName = localPlayerList[roteeID].name;
  $('.message').append("<li>" + roterName + "投了給" + roteeName + "</li>");
});
/***** ROTING *****/

// WAITED 3 SECS
// NEXT ROUND
socket.on('next_round', function() {
  if (gameStarted == false) {
    return;
  }

  turnActioned = false;
  isWolfmanTurn = false;
  stopMoving = false;
  girlClickCount = 0;

  $('#play-title').text("天黑了，請閉眼");
  $('#player-container').fadeOut(1000);
  $('#chatroom').fadeOut(1000);

  // WAIT 6 SECS
  setTimeout(function() {
    if (gameStarted == false) {
      return;
    }

    socket.emit('player_turn', "wolfman");
    socket.emit('player_turn', "littlegirl");
  }, 6000);
});

// END GAME
socket.on('end_game', function(playerList) {
  gameStarted = false;
  turnActioned = false;
  isWolfmanTurn = false;
  stopMoving = false;
  girlClickCount = 0;

  updatePlayerList(playerList);
  for (var i = 0; i < localPlayerList.length; i++) {
    $('#' + i).css("backgroundColor", "black");
  }

  $('#play-start-button').show();

  $('#player-container').off("click");
  $('#player-container').fadeTo(0, 1.0);
  $('#player-container').fadeIn(1000);
  $('#chatroom').fadeIn(1000);

  $('#girl-button').hide();
  $('#play-title').hide();
  $('#play-title').text("");
});
