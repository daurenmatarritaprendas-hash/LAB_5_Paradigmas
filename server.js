
var validation = require('./libs/unalib');
var express = require('express');
var httpModule = require('http');
var socketIo = require('socket.io');

function createServer() {
  var app = express();
  var http = httpModule.createServer(app);
  var io = socketIo(http);

  app.get('/', function(req, res){
    res.sendFile(__dirname + '/index.html');
  });

  io.on('connection', function(socket){
    socket.on('Evento-Mensaje-Server', function(msg){
      msg = validation.validateMessage(msg);
      io.emit('Evento-Mensaje-Server', msg);
    });
  });

  return { app: app, http: http, io: io };
}

if (require.main === module) {
  var server = createServer();
  var port = process.env.PORT || 3000;
  server.http.listen(port, function(){
    console.log('listening on *:' + port);
  });
}

module.exports = { createServer: createServer };
