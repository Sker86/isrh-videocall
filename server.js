var express = require('express');
var app = express();
var http = require('http').Server(app);
io = require('socket.io').listen(http);
var dataRooms = new Array(4).fill(new Array(3).fill(0))
//dataRooms --> [usuario1, usuario2, numusers]

app.use(express.static('.'));

http.listen(3000, function(){
  console.log('listening on *:3000');
});

var boolDebug = 1;
function mydebug(sms){
  if (boolDebug){
    console.log(sms);
  }
}

io.sockets.on('connection', function(socket) {

  // convenience function to log server messages on the client
  function log() {
    var array = ['Message from server:'];
    array.push.apply(array, arguments);
    socket.emit('log', array);
  }

  socket.on('message', function(message) {
    log('Client said: ', message);
    // for a real app, would be room-only (not broadcast)
    socket.broadcast.emit('message', message);
  });

  socket.on('bye', function(sala) {
    log('Client leave room: ', sala);
    dataRooms[sala].fill(0);
    // for a real app, would be room-only (not broadcast)
    socket.broadcast.emit('bye', sala);
  });

  socket.on('create or join', function(message) {
    var sms = JSON.parse(message);
    var room = sms.room;
    log('Server: create or join in room ' + room+' user '+sms.user);

    var numClients = dataRooms[room][2];
    log('Room '+room+' now has '+numClients+' client(s)');

    if (numClients === 0) {
      socket.join(room);
      dataRooms[room][0] = sms.user;
      dataRooms[room][2] = 1;
      log('User 1 ('+sms.user+') created room '+room);
      var cnt = {
        anfitrion: true
      }
      socket.emit('created', JSON.stringify(cnt));
    } else if (numClients === 1) {
      log('Usuario 2 ('+sms.user+') joined room '+room);
      socket.join(room);
      dataRooms[room][1] = sms.user;
      //dataRooms[room][3] = sms.iceCandidate;
      var cnt = {
        usuario1: dataRooms[room][0],
        usuario2: dataRooms[room][1]
      }
      dataRooms[room][2] = 2;
      io.sockets.in(room).emit('joined', JSON.stringify(cnt));
    } else { // max two clients
      socket.emit('full', room);
    }
  });

});
