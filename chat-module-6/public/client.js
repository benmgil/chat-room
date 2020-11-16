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
let chatBox;
let adminCommands;
let muteButton;
let removeButton;
let banButton;
let peopleList;
let recipientSpan;
let showRoomatesButton;
let chatInput;
let sendButton;

let socket;
let username;
let roomName;
let password;
let chatText;
let requestType;

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
  chatBox = document.getElementById("chatlog");
  adminCommands = document.getElementById("admin-commands");
  muteButton = document.getElementById("mute");
  removeButton = document.getElementById("remove");
  banButton = document.getElementById("ban");
  peopleList = document.getElementById("ppl-list");
  recipientSpan = document.getElementById("recipient");
  showPeopleButton = document.getElementById("show-people");
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
  showPeopleButton.addEventListener("click", showPeople);
  sendButton.addEventListener("click", sendChat);
  console.log(sendButton);

  document.getElementById("show-shit").addEventListener("click", function(){
    socket.emit("showShit");
  })
})

//logging in
function signOn(){
  if(loginInput.value == ""){
    errorMessage.innerText = "Error: Please enter a username."
  }
  else{
    socket = io.connect();
    socket.on("request_username", function(){
      username = loginInput.value;
      socket.emit("login", {username:username});
    })
    socket.on("login_response", function(data){
      if(data.status == "success"){
        loginScreen.style.display="none";
        homeScreen.style.display="block";
        errorMessage.innerText = "";
      }
      else{
        errorMessage.innerText = data.message;
      }
    })
    setupSockets();
  }
}

function setupSockets(){

  //loading the list of people in a room, and adding event listeners depending on why the list is being shown
  socket.on("people_response", function(data){
    if(requestType == "chat"){
      let every = document.createElement("p");
      every.className = "people-list";
      every.innerText = "Everyone";
      every.addEventListener("click", function(){
        chatPerson("Everyone");
      });
    }
    data.peopleList.forEach(function(person, i){
      let personP = document.createElement("p");
      personP.className = "people-list";
      personP.innerText = data.peopleList.username;
      if(requestType == "mute"){
        personP.addEventListener("click", function(){
          mutePerson(data.peopleList.username);
        });
      }
      if(requestType == "remove"){
        personP.addEventListener("click", function(){
          removePerson(data.peopleList.username);
        });
      }
      if(requestType == "ban"){
        personP.addEventListener("click", function(){
          banPerson(data.peopleList.username);
        });
      }
      if(requestType == "chat"){
        personP.addEventListener("click", function(){
          chatPerson(data.peopleList.username);
        });
      }
      peopleList.appendChild(personP);
    });
  });

  //updating the chat box
  socket.on("chat_recieved", function(data){
    console.log("AHAH")
    let chatDiv = document.createElement("div");
    let headerP = document.createElement("p");
    let contentP = document.createElement("p");
    contentP.innerText = data.chat_content;
    if(!data.isPrivate){
      headerP.innerText = "From: " + data.sender;
      headerP.className = "public";
      contentP.className = "public";
    }
    else{
      headerP.innerText = "From: " + data.sender + "  (private)";
      headerP.className = "private";
      contentP.className = "private";
    }
    chatDiv.appendChild(headerP);
    chatDiv.appendChild(contentP);
    chatBox.appendChild(chatDiv);
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
    socket.emit("join_room", {roomName:roomName});
  }
  socket.on("join_response", function(data){
    if(data.status == "success"){
      adminCommands.style.display = "none";
      homeScreen.style.display = "none";
      chatScreen.style.display = "block";
      passwordScreen.style.display = "none";
      roomList.style.display = "none";
    }
    else if(data.status == "password_required"){
      homeScreen.style.display = "none";
      roomList.style.dislay = "none";
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
      adminCommands.style.display = "none";
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

  socket.emit("request_rooms_list");
  socket.on("room_list_response", function(data){ //for each received room, create and add room to room list div
    data.roomList.forEach(function(room, i){
      let roomp = document.createElement("p");
      roomp.className = "room-list";
      roomp.innerText = data.roomList.roomName;
      if(data.roomList.isLocked){
        roomp.innerText += " (locked)";
        roomp.addEventListener("click", joinPrivateRoom);
      }
      else{
        roomp.addEventListener("click", joinRoom);
      }
      roomList.appendChild(roomp);
    })
  });
}

function requestMute(){
  socket.emit("people_list");
  requestType = "mute";
  peopleList.style.display="block";
}

function requestRemove(){
  socket.emit("people_list");
  requestType = "remove";
  peopleList.style.display="block";
}

function requestBan(){
  socket.emit("people_list");
  requestType = "ban";
  peopleList.style.display="block";
}

function showPeople(){
  socket.emit("people_list");
  requestType = "chat";
  peopleList.style.display="block";
}

function mutePerson(recipient){
  peopleList.style.display = "none";
  socket.emit("mute_request", {target_user:recipient})
}

function removePerson(recipient){
  peopleList.style.display = "none";
  socket.emit("remove_request", {target_user:recipient})
}

function banPerson(recipient){
  peopleList.style.display = "none";
  socket.emit("ban_request", {target_user:recipient})
}

function chatPerson(recipient){
  peopleList.style.display = "none";
  recipientSpan.innerText = recipient;
}


function sendChat(){
  console.log("AH");
  if(chatInput.value == ""){
    errorMessage.innerText = "Error: Please enter a message"
  }
  else{
    errorMessage.innerText = "";
    chatText = chatInput.value;
    socket.emit("send_chat", {chat_content:chatText, recipient:recipientSpan.innerText, sender:username})
  }
}
