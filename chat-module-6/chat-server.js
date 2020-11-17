
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

    //only send the three files needed
    if(filename == "/client.css" || filename == "/client.js" || filename == "/client.html"){
      fs.readFile(filepath, function (err, data) {
          if (err) return res.writeHead(500);
          res.writeHead(200);
          res.end(data);
      });
    }
    else {   //or a 404
      res.writeHead(404, {
				"Content-Type": "text/plain"
			});
			res.write("Requested file not found: "+filename);
			res.end();

    }
});
server.listen(port);

//socket setup
const socketio = require("socket.io")(server);
const io = socketio.listen(server);

//global storage for users and rooms
let users = {};
let rooms = {};


class User {
  constructor(socket, username){
    this.socket = socket;
    this.username = username;
    this.roomName = "";
  }
  joinRoom(room){
    this.roomName = room;
  }
}

//room class for ease of various room operations
class Room {
  constructor(name, admin, password){
    this.name = name;
    this.admin = admin;
    this.password = password;
    this.users = [admin];
    this.bannedUsers = [];
    this.mutedUsers = [];
  }
  addUser(user){
    this.users.push(user);
  }
  removeUser(username){
    let userToRemove = users[username];
    var userIndex = this.users.indexOf(userToRemove);
    if (userIndex !== -1) {
      this.users.splice(userIndex, 1);
    }
    // var banIndex = this.bannedUsers.indexOf(userToRemove);
    // if (userIndex !== -1) {
    //   this.bannedUsers.splice(banIndex, 1);
    // }
    var muteIndex = this.mutedUsers.indexOf(userToRemove);
    if (muteIndex !== -1) {
      this.mutedUsers.splice(muteIndex, 1);
    }
  }
  banUser(username){
    if(this.bannedUsers.indexOf(username) == -1){
      this.bannedUsers.push(username);
      this.removeUser(username);
    }
  }
  unbanUser(username){
    var banIndex = this.bannedUsers.indexOf(username);
    if(banIndex !== -1){
      this.bannedUsers.splice(banIndex, 1);
    }
  }
  muteUser(username){
    if(this.mutedUsers.indexOf(username) == -1){
      this.mutedUsers.push(username)
    }
  }
  unmuteUser(username){
    var muteIndex = this.mutedUsers.indexOf(username);
    if (muteIndex !== -1) {
      this.mutedUsers.splice(muteIndex, 1);
    }
  }
  isMuted(username){
    return this.mutedUsers.indexOf(username) != -1;
  }
}



io.sockets.on("connection", socket => {
  //global variables for each socket connection
  let roomNameRequested;
  let socketUser;

  //ask for the username
  socket.emit("request_username");


  socket.on('login', function(data){ //when the user attempts to log in
    let requestedUsername = data.username;

    //make sure the username isn't already taken
    if(Object.keys(users).indexOf(requestedUsername) != -1){
      socket.emit("login_response",{status: "failure", message: "Username already in use"})
    }
    else{
      //add the user to the user list and send a success
      socketUser = new User(socket, requestedUsername);
      users[requestedUsername] = socketUser;
      socket.emit("login_response", {status: "success"});
    }
  });

  //when the user requests to create a room
  socket.on('create_room', function (data){
    //make sure the room name isn't taken
    if(Object.keys(rooms).indexOf(data.roomName) == -1){
      let pass = data.password;
      if(!pass){
        pass = "";
      }
      //create a new room object with the creator as admin
      let room = new Room(data.roomName, socketUser, pass);
      rooms[data.roomName] = room;

      //send a success and add the socket to the room
      io.to(socket.id).emit("create_response", {status: "success"})
      socket.join(data.roomName);
      socketUser.joinRoom(data.roomName);
    }
    else{
      io.to(socket.id).emit("create_response", {status: "failure", message: "That room name is taken"});
    }
  })

  //when the user requests to join a room
  socket.on('join_room', function(data){
    roomNameRequested = data.roomName;

    //make sure the room exists
    if(Object.keys(rooms).indexOf(roomNameRequested) != -1){
      let roomRequested = rooms[roomNameRequested]
       //make sure the user isn't banned
      if(roomRequested.bannedUsers.indexOf(socketUser.username) == -1){
        if(roomRequested.password == ""){ //if there's no password let them join
          socket.emit("join_response", {status: "success"});
          socket.join(roomNameRequested);
          roomRequested.addUser(socketUser);
          socketUser.joinRoom(roomNameRequested);
        }
        else{  //if not, let them know there's a password
          socket.emit("join_response", {status: "password_required"});
        }
      }
      else{ // tell them they're banned
        socket.emit("join_response", {status: "failure", message: "You are banned from this group"})
      }
    }
    else{  //tell them the room doesn't exist
      socket.emit("join_response", {status: "failure", message: "That room doesn't exist"});
    }
  });

  //when the user sends a room password
  socket.on("password_entered", function(data){
    let roomRequested = rooms[roomNameRequested]
    if(data.password = roomRequested.password){ //if it's right let them in
      socket.emit("join_response", {status: "success"});
      socket.join(roomNameRequested);
      roomRequested.addUser(socketUser);
      socketUser.joinRoom(roomNameRequested);
    }
    else{ // if not then don't
      socket.emit("join_response", {status: "failure", message: "Incorrect password"});
    }
  });

  //when a user sends a message
  socket.on("send_chat", function(data){
    let room = rooms[socketUser.roomName];

    //if the user hasn't been muted
    if(room.mutedUsers.indexOf(socketUser.username) == -1){
      let recip = data.recipient;
      let isPrivate = false;
      if(recip == "Everyone"){
        io.to(socketUser.roomName).emit("chat_recieved", {
          sender: socketUser.username,
          recipient: recip,
          isPrivate: isPrivate,
          chat_content: data.chat_content
        })
      }
      else{
        isPrivate = true;
        if(users[recip]){
          users[recip].socket.emit("chat_recieved", {
            sender: socketUser.username,
            recipient: recip,
            isPrivate: isPrivate,
            chat_content: data.chat_content
          });
          socket.emit("chat_recieved", {
            sender: socketUser.username,
            recipient: recip,
            isPrivate: isPrivate,
            chat_content: data.chat_content
          });
        }
      }
    }
  })

  socket.on("request_rooms_list", function(){
    let roomList = [];
    for(let r in rooms){
      let room = rooms[r];
      roomList.push({roomName: room.name, isLocked: room.password != ""})
    }
    socket.emit("room_list_response", {roomList: roomList});
  })
  socket.on("people_list", function(){
    let peopleList = [];
    let room = rooms[socketUser.roomName];
    let users = room.users;
    for(let u in users){
      let user = users[u];
      let isMuted = room.isMuted(user.username);
      peopleList.push({username: user.username, muted: isMuted});
    }
    socket.emit("people_response", {peopleList: peopleList});
  });
  socket.on("ban_list", function(){
    let banList = [];
    let room = rooms[socketUser.roomName];
    let users = room.bannedUsers;
    for(let u in users){
      banList.push({username: u})
    }
    socket.emit("people_response", {peopleList: banList});
  })

  socket.on("remove_request", function(data){
    let room = rooms[socketUser.roomName];
    if (socketUser == room.admin){
      let target = data.target_user;
      let targetUser = users[target];
      if(room.users.indexOf(targetUser) != -1){
        room.removeUser(target);
        socket.emit("admin_control_response",{
          status: "success",
          action: "remove"
        })
        targetUser.socket.emit("removed");
      }
      else{
        socket.emit("admin_control_response",{
          status: "failure",
          message: "Target user not in room"
        })
      }
    }
    else{
      socket.emit("access_denied");
    }
  });

  socket.on("ban_request", function(data){
    let room = rooms[socketUser.roomName];
    if (socketUser == room.admin){
      let target = data.target_user;
      let targetUser = users[target];
      if(room.users.indexOf(targetUser) != -1){
        room.banUser(target);
        socket.emit("admin_control_response",{
          status: "success",
          action: "ban"
        })
        targetUser.socket.emit("banned");
      }
      else{
        socket.emit("admin_control_response",{
          status: "failure",
          message: "Target user not in room"
        })
      }
    }
    else{
      socket.emit("access_denied");
    }
  });
  socket.on("unban_request", function(data){
    let room = rooms[socketUser.roomName];
    if (socketUser == room.admin){
      let target = data.target_user;
      let targetUser = users[target];
      if(room.users.indexOf(targetUser) != -1){
        room.unbanUser(target);
        socket.emit("admin_control_response",{
          status: "success",
          action: "unban"
        })
      }
      else{
        socket.emit("admin_control_response",{
          status: "failure",
          message: "Target user not in room"
        })
      }
    }
    else{
      socket.emit("access_denied");
    }
  });


  socket.on("mute_request", function(data){
    let room = rooms[socketUser.roomName];
    if (socketUser == room.admin){
      let target = data.target_user;
      let targetUser = users[target];
      if(room.users.indexOf(targetUser) != -1){
        room.muteUser(target);
        socket.emit("admin_control_response",{
          status: "success",
          action: "mute"
        })
        targetUser.socket.emit("muted");
      }
      else{
        socket.emit("admin_control_response",{
          status: "failure",
          message: "Target user not in room"
        })
      }
    }
    else{
      socket.emit("access_denied");
    }
  });

  socket.on("unmute_request", function(data){
    let room = rooms[socketUser.roomName];
    if (socketUser == room.admin){
      let target = data.target_user;
      let targetUser = users[target];
      if(room.users.indexOf(targetUser) != -1){
        room.unmuteUser(target);
        socket.emit("admin_control_response",{
          status: "success",
          action: "unmute"
        })
        targetUser.socket.emit("unmuted");
      }
      else{
        socket.emit("admin_control_response",{
          status: "failure",
          message: "Target user not in room"
        })
      }
    }
    else{
      socket.emit("access_denied");
    }
  })

  // mute_request
  // remove_request
  // ban_request

  socket.on("disconnect", function(){
    if(typeof socketUser !== 'undefined' && typeof socketUser.username !== 'undefined'){
      if(socketUser.roomName){
        rooms[socketUser.roomName].removeUser(socketUser.username);
      }
      delete users[socketUser.username];
    }
  })
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
