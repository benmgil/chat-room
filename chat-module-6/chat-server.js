
//Static client server initialization
const http = require("http"),
    fs = require("fs");
const port = 3000;
const file = "client.html";
const server = http.createServer(function (req, res) {
    fs.readFile(file, function (err, data) {
        if (err) return res.writeHead(500);
        res.writeHead(200);
        res.end(data);
    });
});
server.listen(port);

//socket setup
const socketio = require("socket.io")(server);
const io = socketio.listen(server);


let rooms = {};

class User {
  constructor(socket, username){
    this.socket = socket;
    this.username = username;
  }
}
class Room {
  constructor(name, admin, password){
    this.name = name;
    this.admin = admin;
    this.password = password;
    this.users = [admin];
    this.bannedUsers = [];
    this.mutedUsers = [];
  }
}



io.sockets.on("connection", socket => {
  let roomNameRequested;
  socket.on('login', function(data){
    socket.user = new User(socket, data.username);
  });

  socket.on('create_room', function (data){
    if(!(data.roomName in Object.keys(rooms)){
      let room = new Room(data.roomName, socket.user, data.password);
      rooms[data.roomName] = room;
      io.to(socket.id).emit("create_response", {status: "success"})
      socket.join(data.roomName);
    }
    else{
      io.to(socket.id).emit("create_response", {status: "failure", message: "That room name is taken"});
    }
  })

  socket.on('join_room', function(data){
    if(data.roomName in Object.keys(room)){
      roomNameRequested = data.roomName;
      let roomRequested = rooms[roomNameRequested]
      if(roomRequested.password == ""){
        io.to(socket.id).emit("join_response", {status: success});
        roomRequested.addUser(socket.user);
      }
      else{
        io.to(socket.id).emit("password_required");
      }
    }
    else{
      io.to(socket.id).emit("join_response", {status: "failure", message: "That room doesn't exist"});
    }
  });

  socket.on("password_entered", function(data){
    if(data.password = rooms[roomNameRequested].password){
      io.to(socket.id).emit("join_response", {status: success});
      roomRequested.addUser(socket.user);
    }
    else{
      io.to(socket.id).emit("join_response", {status: "failure", message: "Incorrect password"});
    }
  });

  socket.on("showShit", function(data){
    console.log(rooms);
  })
    // socket.on('message_to_server', data => {
    //     console.log("message: " + data["message"]); // log it to the Node.JS output
    //     io.sockets.emit("message_to_client", { message: data["message"] }) // broadcast the message to other users
    // });
});
