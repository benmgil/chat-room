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
let chattingBox;
let mutedP;

let socket;
let username;
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
  chattingBox = document.getElementById("chat-box");
  mutedP = document.getElementById("muted");

  loginButton.addEventListener("click", signOn);
  joinRoomButton.addEventListener("click", function(){
    joinRoom();
  })
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
    peopleList.innerHTML = "";
    if(requestType == "chat"){
      let every = document.createElement("p");
      every.className = "people-list";
      every.innerText = "Everyone";
      every.addEventListener("click", function(){
        chatPerson("Everyone");
      });
      peopleList.appendChild(every);
    }
    data.peopleList.forEach(function(person, i){
      if(person.username != username){
        let personP = document.createElement("p");
        personP.className = "people-list";
        personP.innerText = person.username;
        if(requestType == "mute"){
          if(person.muted){
            personP.className += " muted";
          }
          personP.addEventListener("click", function(){
            if(person.muted){
              unmutePerson(person.username);
            }
            else{
              mutePerson(person.username);
            }
          });
        }
        if(requestType == "remove"){
          personP.addEventListener("click", function(){
            removePerson(person.username);
          });
        }
        if(requestType == "ban"){
          personP.addEventListener("click", function(){
            banPerson(person.username);
          });
        }
        if(requestType == "chat"){
          personP.addEventListener("click", function(){
            chatPerson(person.username);
          });
        }
        peopleList.appendChild(personP);
      }
    });
  });

  //updating the chat box
  socket.on("chat_recieved", function(data){
    console.log("AHAH")
    let chatDiv = document.createElement("div");
    let headerP = document.createElement("p");
    headerP.className = "header";
    let contentP = document.createElement("p");
    contentP.className = "content";
    contentP.innerText = data.chat_content;
    if(!data.isPrivate){
      headerP.innerText = "From: " + data.sender + "     To: " + data.recipient;
      chatDiv.className = "chat-div public";
    }
    else{
      headerP.innerText = "From: " + data.sender + "     To: " + data.recipient + " (private)";
      chatDiv.className = "chat-div private";
    }
    chatDiv.appendChild(headerP);
    chatDiv.appendChild(contentP);
    chatBox.appendChild(chatDiv);
  })

  //join chat room response handler
  socket.on("join_response", function(data){
    if(data.status == "success"){
      adminCommands.style.display = "none";
      homeScreen.style.display = "none";
      chatScreen.style.display = "block";
      passwordScreen.style.display = "none";
      browseScreen.style.display = "none";
    }
    else if(data.status == "password_required"){
      homeScreen.style.display = "none";
      browseScreen.style.display = "none";
      passwordScreen.style.display = "block";
    }
    else{
      errorMessage.innerText= data.message;
    }
  })

  //create chat room response handler
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

  socket.on("access_denied", function(){
    alert("You do not have access to this action.");
  })

  socket.on("admin_control_response", function(data){
    if(data.status == "failure"){
      alert(data.message);
    }
  })

  socket.on("muted", function(){
    chattingBox.style.dispay = "none";
    mutedP.style.display = "block";
  })

  socket.on("unmuted", function(){
    chattingBox.style.dispay = "block";
    mutedP.style.display = "unmute";
  })

  socket.on("removed", function(){
    window.location.reload(true);
    alert("You have been removed from the room.");
  })

  socket.on("banned", function(){
    window.location.reload(true);
    alert("You have been banned from the room.");
  })
}

//joining room
function joinRoom(roomName = ""){
  console.log(roomName);
  if(roomInput.value == "" && roomName == ""){
    errorMessage.innerText = "Error: Please enter a room name."
  }
  else{
    if(roomName == "")
      roomName = roomInput.value;
    errorMessage.innerText = "";
    console.log(roomInput.value);
    console.log(roomName);
    socket.emit("join_room", {roomName: roomName});
  }
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
    let roomName = createNameInput.value;

    if( !(createPasswordInput.value == "") ){
      password = createPasswordInput.value;
    }
    //send info to server
    socket.emit("create_room", { roomName:roomName, password:password});
  }






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
      roomp.innerText = room.roomName;
      if(room.isLocked){
        roomp.innerText += " (locked)";
      }
      roomp.addEventListener("click", function(){
        joinRoom(room.roomName);
      });

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

function unmutePerson(recipient){
  peopleList.style.display = "none";
  socket.emit("unmute_request", {target_user:recipient})
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
