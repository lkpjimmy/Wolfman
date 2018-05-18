$(function(){
  $(document).keypress(function(e) {
    if(e.which == 13) {
      if (isJoinedRoom == false) {
        return;
      }

      var message = $('#message-input').val();
      if (message == "") {
        return;
      }

      $('#message-input').val("");
      socket.emit('new_message', message, isWolfmanTurn);
    }
  });

  socket.on('new_message', function(data) {
    var name = data.name;
    var message = data.message;

    if (data.isWolfmanTurn == true) {
      if (isWolfmanTurn == true) {
        $('.message').append("<li>" + name + ": " + message + "</li>");
      }
    }
    else {
      $('.message').append("<li>" + name + ": " + message + "</li>");
    }
  });
});
