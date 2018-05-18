// Setup basic express server
var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var port = process.env.PORT || 3000;

server.listen(port, function () {
  console.log('Server listening at port %d', port);
});

// Routing
app.get('/', function(req, res){
  res.sendFile(__dirname + '/public/index.html');
});

app.use(express.static(__dirname + '/public'));

var roomList = [];
var playerPosts = ["狼人", "平民", "守衛", "預言家", "獵人", "小女孩"];

/***** ROOM FUNCTIONS *****/
// function getRoomByName(roomName) {
//   for (var i = 0; i < roomList.length; i++) {
//     if (roomList[i]["name"] == roomName) {
//       return roomList[i];
//     }
//   }
//   return null;
// }

// function deleteRoomRegularly() {
//   for (var i = roomList.length - 1; i >= 0; i--) {
//     if (roomList[i]["numPlayer"] == 0) {
//       roomList.splice(i, 1);
//     }
//   }
// }
//
// setInterval(deleteRoomRegularly, 30000);
/***** ROOM FUNCTIONS *****/


// A socket should have
// 1. room info
   // roomName
// 2. player info
   // playerID

// socket == client

io.on('connection', function (socket) {
  // UPDATE ROOM LIST EVERY 1 SEC
  setInterval(function() {socket.emit('update_room_list', roomList)}, 1000);

  // RENEW PLAYER
  function renewPlayerList(playerList) {
    console.log("renewPlayerList");
    for (var i = 0; i < playerList.length; i++) {
      playerList[i].isAlived = true;
      playerList[i].isNextRoundAlived = true;
      playerList[i].hasRoted = false;
      playerList[i].roteCount = 0;
    }

    return playerList;
  }

  // ASSIGN POSTS TO PLAYER
  function assignPostsIn(playerList) {
    console.log("assignPostsIn");
    var playerPostsExpected = [0, 0, 0, 0, 0, 0];

    switch(playerList.length) {
      case 8:
        playerPostsExpected = [2, 2, 1, 1, 1, 1];
        break;
      case 9:
        playerPostsExpected = [2, 3, 1, 1, 1, 1];
        break;
      case 10:
        playerPostsExpected = [3, 3, 1, 1, 1, 1];
        break;
      case 11:
        playerPostsExpected = [3, 4, 1, 1, 1, 1];
        break;
      case 12:
        playerPostsExpected = [4, 4, 1, 1, 1, 1];
        break;
    }

    var playerPostsCount = [0, 0, 0, 0, 0, 0];
  	for (var i = 0; i < playerList.length; i++) {
      var randomIndex = Math.floor(Math.random()*playerPosts.length);
      while (playerPostsCount[randomIndex] == playerPostsExpected[randomIndex]) {
        randomIndex = Math.floor(Math.random()*playerPosts.length);
      }
      ++playerPostsCount[randomIndex];
      playerList[i].post = playerPosts[randomIndex];
  	}

    console.log(playerList);

  	return playerList;
  }

  // ADD ROOM
  socket.on('add_room', function(room) {
    console.log("add_room");
    console.log("new room name: " + room.name + ", capacity: " + room.capacity + ", numPlayer: " + room.numPlayer);

    roomList.push(room);
  });

  // ADD PLAYER
  socket.on('add_player', function (player) {
    console.log("add_player");
    console.log("new player name: " + player.name);
    socket.player = player;
  });

  // JOIN ROOM
  socket.on('join_room', function(roomID, roomName) {
    console.log("join_room");

    socket.join(roomName);
    socket.roomID = roomID;
    socket.roomName = roomName;
    socket.currentRoom = roomList[socket.roomID];

    socket.player.id = socket.currentRoom.numPlayer;
    socket.player.socketID = socket.id;
    socket.currentRoom.numPlayer = socket.currentRoom.numPlayer + 1;

    if (socket.currentRoom.playerList == null) {
      socket.currentRoom.playerList = [];
    }
    socket.currentRoom.playerList.push(socket.player);
    console.log(socket.currentRoom.playerList);
    console.log("numPlayer: " + socket.currentRoom.numPlayer);
    console.log("capacity: " + socket.currentRoom.capacity);

    io.in(socket.roomName).emit('join_room_finished', socket.currentRoom.playerList);

  /***** MAIN *****/
    // numPLayer reaches capacity
    // console.log("start_game");
    // if (socket.currentRoom.numPlayer == socket.currentRoom.capacity) {
    //   // EMIT START GAME
    //   socket.currentRoom.isPlaying = true;
    //   socket.currentRoom.playerList = renewPlayerList(socket.currentRoom.playerList);
    //   socket.currentRoom.playerList = assignPostsIn(socket.currentRoom.playerList);
    //
    //   io.in(socket.roomName).emit('start_game', socket.currentRoom.playerList);
    //   io.in(socket.roomName).emit('get_player_id');
    // }
  /***** MAIN *****/
  });

  /***** MAIN *****/
  // PRESSED START BUTTON
  socket.on('start_game', function() {
    console.log("start_game");
    if (socket.currentRoom.numPlayer >= 8) {
      // EMIT START GAME
      socket.currentRoom.isPlaying = true;
      socket.currentRoom.playerList = renewPlayerList(socket.currentRoom.playerList);
      socket.currentRoom.playerList = assignPostsIn(socket.currentRoom.playerList);

      io.in(socket.roomName).emit('start_game', socket.currentRoom.playerList);
      io.in(socket.roomName).emit('get_player_id');
    }
  });

  // EMIT GET PLAYER ID FINISHED
  socket.on('get_player_id', function() {
    console.log("get_player_id");
    socket.emit('get_player_id_finished', socket.player.id);
  });
  /***** MAIN *****/

  // WAITED 6 SECS
  // EMIT ASSIGN POSTS FINISHED
  socket.on('assign_posts', function() {
    console.log("assign_posts");
    if (socket.currentRoom == null || socket.player.id == null) {
      return;
    }
    io.to(socket.id).emit('assign_posts_finished', socket.currentRoom.playerList[socket.player.id].post);
  });

  /***** DIFFERENT POSTS *****/
  socket.on('player_turn', function(post) {
    if (socket.currentRoom == null || socket.player.id == null) {
      return;
    }

    // WAITED 6 SECS
    console.log("player_turn");
    if (post == "wolfman") {
      if (socket.currentRoom.playerList[socket.player.id].post == "狼人") {
        var stillAlived = socket.currentRoom.playerList[socket.player.id].isAlived;
        io.to(socket.id).emit('player_turn', "wolfman", stillAlived);
        io.in(socket.roomName).emit('mc_speak', '狼人，這晚要殺誰？');
        io.in(socket.roomName).emit('show_ui');
      }
    }

    else if (post == "defender") {
      if (socket.currentRoom.playerList[socket.player.id].post == "守衛") {
        var stillAlived = socket.currentRoom.playerList[socket.player.id].isAlived;
        io.to(socket.id).emit('player_turn', "defender", stillAlived);
        io.in(socket.roomName).emit('mc_speak', '守衛，這晚要守護誰？');
        io.in(socket.roomName).emit('show_ui');
      }
    }

    else if (post == "prophet") {
      if (socket.currentRoom.playerList[socket.player.id].post == "預言家") {
        var stillAlived = socket.currentRoom.playerList[socket.player.id].isAlived;
        io.to(socket.id).emit('player_turn', "prophet", stillAlived);
        io.in(socket.roomName).emit('mc_speak', '預言家，這晚想知道誰的身份？');
        io.in(socket.roomName).emit('show_ui');
      }
    }

    else if (post == "hunter") {
      if (socket.currentRoom.playerList[socket.player.id].post == "獵人") {
        var stillAlived = socket.currentRoom.playerList[socket.player.id].isAlived;
        io.to(socket.id).emit('player_turn', "hunter", stillAlived);
        io.in(socket.roomName).emit('mc_speak', '獵人，選一位陪葬！');
        io.in(socket.roomName).emit('show_ui');
      }
    }

    else if (post == "littlegirl") {
      if (socket.currentRoom.playerList[socket.player.id].post == "小女孩") {
        var stillAlived = socket.currentRoom.playerList[socket.player.id].isAlived;
        var wolfmanID = [];
        for (var i = 0; i < socket.currentRoom.playerList.length; i++) {
          if (socket.currentRoom.playerList[i].post == "狼人") {
            wolfmanID.push(i);
          }
        }

        io.to(socket.id).emit('show_info_for_littlegirl', stillAlived, wolfmanID);
      }
    }
  });

  socket.on('player_action', function(playerID) {
    if (socket.currentRoom == null || socket.player.id == null) {
      return;
    }

    console.log("player_action");
    if (socket.currentRoom.playerList[socket.player.id].post == "狼人") {
      if (playerID != null) {
        console.log("wolfman chose: " + socket.currentRoom.playerList[playerID].name);
        socket.currentRoom.playerList[playerID].isNextRoundAlived = false;
      }
      io.in(socket.roomName).emit('player_finished', "wolfman");
      io.in(socket.roomName).emit('next_post', "defender");
    }

    else if (socket.currentRoom.playerList[socket.player.id].post == "守衛") {
      if (playerID != null) {
        console.log("defender chose: " + socket.currentRoom.playerList[playerID].name);
        socket.currentRoom.playerList[playerID].isNextRoundAlived = true;
      }
      io.in(socket.roomName).emit('player_finished', "defender");
      io.in(socket.roomName).emit('next_post', "prophet");
    }

    else if (socket.currentRoom.playerList[socket.player.id].post == "預言家") {
      if (playerID != null) {
        console.log("prophet chose: " + socket.currentRoom.playerList[playerID].name);
        var goodOrBad = "";

        if (socket.currentRoom.playerList[playerID].post != "狼人") {
          goodOrBad = "好人";
        }
        else {
          goodOrBad = "壞人";
        }
        io.in(socket.roomName).emit('mc_speak', '他是' + goodOrBad);
      }
      io.in(socket.roomName).emit('player_finished', "prophet");
      io.to(socket.id).emit('end_round');
    }

    else if (socket.currentRoom.playerList[socket.player.id].post == "獵人") {
      if (playerID != null) {
        console.log("hunter chose: " + socket.currentRoom.playerList[playerID].name);
        socket.currentRoom.playerList[playerID].isNextRoundAlived = null;
        socket.currentRoom.playerList[playerID].isAlived = false;

        io.in(socket.roomName).emit('update_player_list', socket.currentRoom.playerList);

        if (isGameEnd() != 2) {
          checkWhoWin();
          return;
        }
      }

      // WAIT 3 SECS
      setTimeout(function() {
        if (socket.currentRoom == null || socket.player.id == null) {
          return;
        }

        io.in(socket.roomName).emit('next_round');
      }, 3000);
    }
  });

  socket.on('found_littlegirl', function(playerID) {
    if (socket.currentRoom.playerList[playerID].isAlived == false) {
      return;
    }

    io.in(socket.roomName).emit('mc_speak', '小女孩被發現!');
    socket.currentRoom.playerList[playerID].isNextRoundAlived = false;
  });
  /***** DIFFERENT POSTS *****/

  function isGameEnd() {
    var countWolfman = 0;
    for (var i = 0; i < socket.currentRoom.playerList.length; i++) {
      if (socket.currentRoom.playerList[i].post == "狼人") {
        if (socket.currentRoom.playerList[i].isAlived == true) {
          countWolfman++;
        }
      }
    }

    var countCivilian = 0;
    for (var i = 0; i < socket.currentRoom.playerList.length; i++) {
      if (socket.currentRoom.playerList[i].post == "平民") {
        if (socket.currentRoom.playerList[i].isAlived == true) {
          countCivilian++;
        }
      }
    }

    var countOthers = 0;
    for (var i = 0; i < socket.currentRoom.playerList.length; i++) {
      if (socket.currentRoom.playerList[i].post != "狼人" && socket.currentRoom.playerList[i].post != "平民") {
        if (socket.currentRoom.playerList[i].isAlived == true) {
          countOthers++;
        }
      }
    }

    // DRAW
    if (countWolfman == 1 && countCivilian == 1 && countOthers == 0) {
      return 3;
    }

    // WOLFMAN WINS
    if (countWolfman <= 0) {
      return 0;
    }
    // CIVILIAN WINS
    else if (countCivilian <= 0) {
      return 1;
    }
    // CONTINUE
    else {
      return 2;
    }
  }

  function checkWhoWin() {
    console.log("checkWhoWin");
    if (isGameEnd() == 0) {
      io.in(socket.roomName).emit('mc_speak', '平民勝出!');
    }
    else if (isGameEnd() == 1) {
      io.in(socket.roomName).emit('mc_speak', '狼人勝出!');
    }
    else if (isGameEnd() == 3) {
      io.in(socket.roomName).emit('mc_speak', '平手!');
    }

    // WAIT 3 SECS
    setTimeout(function() {
      if (socket.currentRoom == null || socket.player.id == null) {
        return;
      }

      socket.currentRoom.playerList = renewPlayerList(socket.currentRoom.playerList);
      io.in(socket.roomName).emit('end_game', socket.currentRoom.playerList);
      socket.currentRoom.isPlaying = false;
    }, 3000);
  }

  // WAITED 3 SECS
  // END ROUND
  socket.on('end_round', function() {
    if (socket.currentRoom == null || socket.player.id == null) {
      return;
    }

    var someoneDead = false;
    var whoIsDead = "";

    for (var i = 0; i < socket.currentRoom.playerList.length; i++) {
      socket.currentRoom.playerList[i].hasRoted = false;
      socket.currentRoom.playerList[i].roteCount = 0;

      if (socket.currentRoom.playerList[i].isNextRoundAlived == false) {
        socket.currentRoom.playerList[i].isNextRoundAlived = null;
        socket.currentRoom.playerList[i].isAlived = false;
        someoneDead = true;
        whoIsDead += "，" + socket.currentRoom.playerList[i].name;
      }
    }

    if (someoneDead == true) {
      whoIsDead += "死去!";
    }
    else {
      whoIsDead = "無人被殺!";
    }
    io.in(socket.roomName).emit('mc_speak', '這晚' + whoIsDead);

    io.in(socket.roomName).emit('update_player_list', socket.currentRoom.playerList);

    if (isGameEnd() != 2) {
      checkWhoWin();
      return;
    }

    // WAIT 3 SECS
    setTimeout(function() {
      if (socket.currentRoom == null || socket.player.id == null) {
        return;
      }

      io.in(socket.roomName).emit('mc_speak', '開始投票!');
      io.in(socket.roomName).emit('start_roting');
    }, 3000);

    console.log("end_round");
    console.log(socket.currentRoom.playerList);
  });

  // ROTING
  socket.on('rote_action', function(playerID) {
    console.log("rote_action");
    if (socket.currentRoom == null || socket.player.id == null) {
      return;
    }

    socket.currentRoom.playerList[socket.player.id].hasRoted = true;
    socket.currentRoom.playerList[playerID].roteCount = socket.currentRoom.playerList[playerID].roteCount + 1;

    io.in(socket.roomName).emit('show_who_rote_who', socket.player.id, playerID);

    for (var i = 0; i < socket.currentRoom.playerList.length; i++) {
      if (socket.currentRoom.playerList[i].isAlived == true && socket.currentRoom.playerList[i].hasRoted == false) {
        return;
      }
    }

    var tmpCount = 0;
    var roteToDie = null;
    var sameRote = false;
    var hunterDead = false;

    for (var i = 0; i < socket.currentRoom.playerList.length; i++) {
      if (socket.currentRoom.playerList[i].roteCount > tmpCount) {
        tmpCount = socket.currentRoom.playerList[i].roteCount;
        roteToDie = socket.currentRoom.playerList[i];
      }
    }

    var counter = 0;

    for (var i = 0; i < socket.currentRoom.playerList.length; i++) {
      if (socket.currentRoom.playerList[i].roteCount == tmpCount) {
        counter++;
      }
    }

    if (counter >= 2) {
      sameRote = true;
    }

    if (sameRote == true) {
      // WAIT 3 SECS
      setTimeout(function() {
        if (socket.currentRoom == null || socket.player.id == null) {
          return;
        }

        for (var i = 0; i < socket.currentRoom.playerList.length; i++) {
          socket.currentRoom.playerList[i].hasRoted = false;
          socket.currentRoom.playerList[i].roteCount = 0;
        }
        io.in(socket.roomName).emit('mc_speak', '同票，重新投票!');
        io.in(socket.roomName).emit('start_roting');
      }, 3000);

      return;
    }

    if (roteToDie != null) {
      roteToDie.isNextRoundAlived = null;
      roteToDie.isAlived = false;
      io.in(socket.roomName).emit('update_player_list', socket.currentRoom.playerList);
      io.in(socket.roomName).emit('mc_speak', roteToDie.name + "被處死！");

      if (roteToDie.post == "獵人") {
        hunterDead = true;
      }

      if (isGameEnd() != 2) {
        checkWhoWin();
        return;
      }

      if (hunterDead == true) {
        io.in(socket.roomName).emit('hunter_turn');
      }
      else {
        // WAIT 3 SECS
        setTimeout(function() {
          if (socket.currentRoom == null || socket.player.id == null) {
            return;
          }

          io.in(socket.roomName).emit('next_round');
        }, 3000);
      }
    }

    console.log("roted");
    console.log(socket.currentRoom.playerList);
  });

  // NEW MESSAGE
  socket.on('new_message', function (message, isWolfmanTurn) {
    io.in(socket.roomName).emit('new_message', {
      name: socket.player.name,
      message: message,
      isWolfmanTurn: isWolfmanTurn
    });
  });

  // LEAVE ROOM
  function initSocket() {
    socket.currentRoom = null;
    socket.roomID = null;
    socket.roomName = null;
    socket.player.id = null;
    socket.player.socketID = null;
  }

  function leaveRoom() {
    if (socket.roomID == null || socket.roomName == null) {
      return;
    }

    if (socket.currentRoom.isPlaying == true) {
      io.in(socket.roomName).emit('end_game', socket.currentRoom.playerList);
    }

    socket.leave(socket.roomName);
    socket.currentRoom.numPlayer = socket.currentRoom.numPlayer - 1;
    if (socket.currentRoom.numPlayer < 0) {
      socket.currentRoom.numPlayer = 0;
    }
    socket.currentRoom.playerList.splice(socket.player.id, 1);

    for (var i = 0; i < socket.currentRoom.playerList.length; i++) {
      socket.currentRoom.playerList[i]["id"] = i;
    }

    io.in(socket.roomName).emit('leave_room_finished', socket.currentRoom.playerList);

    if (socket.currentRoom.isPlaying == true) {
      socket.currentRoom.playerList = renewPlayerList(socket.currentRoom.playerList);
      socket.currentRoom.isPlaying = false;
    }

    initSocket();
  }

  socket.on('leave_room', function() {
    console.log("leave_room");
    leaveRoom();
  });

  socket.on('disconnect', function () {
    console.log("disconnect");
    leaveRoom();
  });
});
