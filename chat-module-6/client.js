let loginScreen;
let homeScreen;
let passwordScreen;
let createScreen;
let browseScreen;
let chatScreen;

let errorMessage;
let loginButton;    
let loginInput;    
let roomInput;     
let joinRoomButton; 
let joinPrivateRoomButton;
let browseRoomsButton;   
let createRoomButton;    
let passwordInput;    
let createNameInput;
let createPasswordInput;
let createButton;
let roomList;
let chatLog;
let adminCommands;
let muteButton;
let removeButton;
let banButton;
let roomatesList;
let recipientSpan;
let showRoomatesButton;
let chatInput;
let sendButton;

let socket;
let username;
let roomName;
let password;
let chatText;

document.addEventListener("DOMContentLoaded", function(){
  loginScreen = document.getElementById("login-screen");
  homeScreen = document.getElementById("home-screen");
  passwordScreen = document.getElementById("password-screen");
  createScreen = document.getElementById("create-screen");
  browseScreen = document.getElementById("browse-screen");
  chatScreen = document.getElementById("chat-screen");

  errorMessage = document.getElementById("error-message");
  loginButton = document.getElementById("login");
  loginInput = document.getElementById("username");
  roomInput = document.getElementById("room-name");
  joinRoomButton = document.getElementById("join-room");
  joinPrivateRoomButton = document.getElementById("join-private-room");
  browseRoomsButton = document.getElementById("browse");
  createRoomButton = document.getElementById("create-room");
  passwordInput = document.getElementById("password-input");
  createNameInput = document.getElementById("new-room-name");
  createPasswordInput = document.getElementById("new-room-password");
  createButton = document.getElementById("create-room-button");
  browseScreen = document.getElementById("browse-screen");
  roomList = document.getElementById("room-list");
  chatLog = document.getElementById("chatlog");
  adminCommands = document.getElementById("chat-commands");
  muteButton = document.getElementById("mute");
  removeButton = document.getElementById("remove");
  banButton = document.getElementById("ban");
  roomatesList = document.getElementById("ppl-list");
  recipientSpan = document.getElementById("recipient");
  showRoomatesButton = document.getElementById("show-people");
  chatInput = document.getElementById("message-input");
  sendButton = document.getElementById("send-button");

  loginButton.addEventListener("click", signOn);
  joinRoomButton.addEventListener("click", joinRoom)
  browseRoomsButton.addEventListener("click", toRoomsList)
  createRoomButton.addEventListener("click", toCreateRoom);
  createButton.addEventListener("click", createRoom)
  joinPrivateRoomButton.addEventListener("click", joinPrivateRoom);
  muteButton.addEventListener("click", requestMute);
  removeButton.addEventListener("click", requestRemove);
  banButton.addEventListener("click", requestBan);
  showRoomatesButton.addEventListener("click", showPeople);
  sendButton.addEventListener("click", sendChat);
})

//logging in
function signOn(){
  if(loginInput.value == ""){
    errorMessage.innerText = "Error: Please enter a username."
  }
  else{
    username = loginInput.value;
    loginScreen.style.display="none";
    homeScreen.style.display="block";
    errorMessage.innerText = "";
    socket = io.connect();
    socket.on("request_username", function(){
      socket.emit("login", {username:username});
    })
    setupSockets();
  }
}

function setupSockets(){
  socket.on("people_response", function(data){
    
  })
}

//joining room
function joinRoom(){
  if(roomInput.value == ""){
    errorMessage.innerText = "Error: Please enter a room name."
  }
  else{
    roomName = roomInput.value;
    errorMessage.innerText = "";
    socket.emit("join_room", {username:username, roomName:roomName});
  }
  socket.on("join_response", function(data){
    if(data.status == "success"){
      homeScreen.style.display = "none";
      chatScreen.style.disoplay = "block";
    }  
    else if(data.status == "password_required"){
      homeScreen.style.display = "none";
      passwordScreen.style.display = "block";
    }
    else{
      errorMessage.innerText= data.message;
    }
  })
}

//joining private room
function joinPrivateRoom(){
  if(passwordInput.value == ""){
    errorMessage.innerText = "Error: Please enter a password."
  }
  else{
    password = passwordInput.value;
    socket.emit("password_entered", {password:password});
    socket.on("password_response", function(data){
      if(data.status == "success"){
        errorMessage.innerText = "";
        passwordScreen.style.display = "none";
        chatScreen.style.display = "block";
      }
      else{
        errorMessage.innerText = data.message;
      }
    });
  }
}

//choosing to create a room
function toCreateRoom(){
  homeScreen.style.display="none";
  createScreen.style.display="block";
}

//creating a new room 
function createRoom(){
  //validating input existence and storing input values
  if(createNameInput.value == ""){
    errorMessage.innerText = "Error: Please enter a room name."
  }
  else{
    roomName = createNameInput.value;
  }
  if( !(createPasswordInput.value == "") ){
    password = createPasswordInput.value;
  }

  //send info to server
  socket.emit("create_room", { roomName:roomName, password:password});

  socket.on("create_response", function(data){
    if(data.status == "success"){
      createScreen.style.display="none";
      chatScreen.style.display="block";
      errorMessage.innerText = "";
    }
    else{
      errorMessage.innerText = data.message;
    }
  })

}

//to browse current rooms
function toRoomsList(){
  homeScreen.style.display="none";
  browseScreen.style.display="block";
  roomList.innerHTML = "";

  socket.emit("showShit");
  //socket.emit("request_rooms_list");
  socket.on("room_list_response", function(data){ //for each received room, create and add room to room list div
    data.roomList.forEach(function(room, i){
      let roomp = document.createElement("p");
      roomp.className = "room-list";
      roomp.innerText = data.roomList.roomName;
      if(data.roomList.isLocked){
        roomp.innerText += " (locked)";
      }
      roomList.appendChild(roomp);
    })
  });
}

socket.on("people_")


function loadPeople(){

}

function requestMute(){

}
