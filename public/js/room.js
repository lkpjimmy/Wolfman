function addRoom(name, capacity) {
  var regexp = /^[0-9]*$/;

  if (name == "" || isRoomNameExist(name) == true || capacity == "" || regexp.test(capacity) == false || (capacity < 8 || capacity > 12)) {
    vibrateElement($('.modal-footer'));
    return;
  }

  var numPlayer = 0;
  var isPlaying = false;
  var room = new Room(name, capacity, numPlayer, isPlaying);

  socket.emit('add_room', {
      name: room["name"],
      capacity: room["capacity"],
      numPlayer: room["numPlayer"],
      isPlaying: room["isPlaying"]
  });

  $('#room-create-box').fadeOut();
}

function joinRoom(roomID, roomName) {
  if (localRoomList[roomID]["numPlayer"] == localRoomList[roomID]["capacity"]) {
    isJoinedRoom = false;
    return;
  }

  if (localRoomList[roomID]["isPlaying"] == true) {
    isJoinedRoom = false;
    return;
  }

  isJoinedRoom = true;
  socket.emit('join_room', roomID, roomName);
  fadeOutFadeIn($('#room-list'), $('#play-area'));
}

function isRoomNameExist(roomName) {
  for (var i = 0; i < localRoomList.length; i++) {
    if (localRoomList[i]["name"] == roomName) {
      return true;
    }
  }
  return false;
}

function updateRoomList(roomList) {
  localRoomList = [];
  $('#room-items').empty();

  $.each(roomList, function(key, value) {
    var room = new Room(value["name"], value["capacity"], value["numPlayer"], value["isPlaying"]);
    localRoomList.push(room);
    $('#room-items').append("<tr class=\"room-item\" id=\"" + key + "\"><td>" + value["name"] + "</td>" + "<td>" + value["numPlayer"] + "/" + value["capacity"] + "</td></tr>");
  });
}

socket.on('update_room_list', function(roomList) {
  updateRoomList(roomList);
});

socket.on('join_room_finished', function(playerList) {
  updatePlayerList(playerList);
});

socket.on('leave_room_finished', function(playerList) {
  updatePlayerList(playerList);
})
