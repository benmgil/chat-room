
//Static client server initialization
const http = require("http"),
    fs = require("fs"),
    url = require('url'),
    mime = require('mime'),
    path = require('path');
const port = 3000;
let file = "client.html";
const server = http.createServer(function (req, res) {
    let filename = url.parse(req.url).pathname;
    if(filename == "/")
      filename = "/client.html";
    let filepath = path.join(__dirname, "public", filename);
    if(filename == "/client.css" || filename == "/client.js" || filename == "/client.html"){
      fs.readFile(filepath, function (err, data) {
          if (err) return res.writeHead(500);
          res.writeHead(200);
          res.end(data);
      });
    }
    else {
      res.writeHead(404, {
				"Content-Type": "text/plain"
			});
			res.write("Requested file not found: "+filename);
			res.end();

    }
  // var filename = path.join(__dirname, "public", url.parse(req.url).pathname);
	// (fs.exists || path.exists)(filename, function(exists){
	// 	if (exists) {
	// 		fs.readFile(filename, function(err, data){
	// 			if (err) {
	// 				// File exists but is not readable (permissions issue?)
	// 				res.writeHead(500, {
	// 					"Content-Type": "text/plain"
	// 				});
	// 				res.write("Internal server error: could not read file");
	// 				res.end();
	// 				return;
	// 			}
  //
	// 			// File exists and is readable
	// 			var mimetype = mime.getType(filename);
	// 			res.writeHead(200, {
	// 				"Content-Type": mimetype
	// 			});
	// 			res.write(data);
	// 			res.end();
	// 			return;
	// 		});
	// 	}else{
	// 		// File does not exist
	// 		res.writeHead(404, {
	// 			"Content-Type": "text/plain"
	// 		});
	// 		res.write("Requested file not found: "+filename);
	// 		res.end();
	// 		return;
	// 	}
	// });
});
server.listen(port);

//socket setup
const socketio = require("socket.io")(server);
const io = socketio.listen(server);

let users = {};
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
  let socketUser = new User(socket);
  socket.emit("request_username");
  socket.on('login', function(data){
    let requestedUsername = data.username;
    console.log(requestedUsername);
    console.log(Object.keys(users));
    console.log(requestedUsername in Object.keys(users))
    console.log(Object.keys(users).indexOf(requestedUsername));
    if(Object.keys(users).indexOf(requestedUsername) != -1){
      console.log("IF")
      socket.emit("login_response",{status: "failure", message: "Username already in use"})
    }
    else{
      console.log("ELSE")
      users[requestedUsername] = new User(socket, requestedUsername);
      socket.emit("login_response", {status: "success"});
    }
    // console.log(data.username);
    // socketUser.setUsername(data.username)
  });

  socket.on('create_room', function (data){
    //console.log(socketUser);
    if(!(data.roomName in Object.keys(rooms))){
      let room = new Room(data.roomName, socketUser, data.password);
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
    console.log(users);
    console.log(" ");
  })
    // socket.on('message_to_server', data => {
    //     console.log("message: " + data["message"]); // log it to the Node.JS output
    //     io.sockets.emit("message_to_client", { message: data["message"] }) // broadcast the message to other users
    // });
});
