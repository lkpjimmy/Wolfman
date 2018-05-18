function vibrateElement(element) {
  element.addClass('animated shake');
  element.on('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend',
  function(){element.removeClass('animated shake');});
}

function fadeOutFadeIn(elementOut, elementIn) {
  elementOut.fadeOut();
  elementIn.fadeIn();
}

$(function() {
  addPlayer("test");

  $('#login-button').click(function() {
    var name = $('#login-name').val();
    addPlayer(name);
  });

  $('#room-confirm-button').click(function() {
    var name = $('#room-name').val();
    var capacity = $('#room-capacity').val();
    addRoom(name, capacity);
  });

  $('#room-create-button').click(function() {
    $('#room-create-box').fadeIn();
  });

  $('#room-cancel-button').click(function() {
    $('#room-create-box').fadeOut();
  });

  $('#play-start-button').click(function() {
    socket.emit('start_game');
  });

  $('#play-end-button').click(function() {
    socket.emit('leave_room');
    fadeOutFadeIn($('#play-area'), $('#room-list'));
    isJoinedRoom = false;
  });

  $(document).on('click', 'tr', function() {
    if (isJoinedRoom == true) {
      return;
    }

    if ($(this).attr('class') == null || $(this).attr('id') == null) {
      return;
    }

    if ($(this).attr('class') == "room-item") {
      var roomID = $(this).attr('id');
      var roomName = localRoomList[roomID]["name"];
      joinRoom(roomID, roomName);
    }
  });

});
