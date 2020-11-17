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
let unbanButton;
let peopleList;
let recipientSpan;
let showRoomatesButton;
let chatInput;
let sendButton;
let chattingBox;
let mutedP;
let leaveButton;
let closeButton;

let socket;
let username;
let password;
let chatText;
let requestType;
let pplListShown = false;

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
  unbanButton = document.getElementById("unban");
  peopleList = document.getElementById("ppl-list");
  recipientSpan = document.getElementById("recipient");
  showPeopleButton = document.getElementById("show-people");
  chatInput = document.getElementById("message-input");
  sendButton = document.getElementById("send-button");
  chattingBox = document.getElementById("chat-box");
  mutedP = document.getElementById("muted");
  leaveButton = document.getElementById("leave-room");
  closeButton = document.getElementById("close");

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
  unbanButton.addEventListener("click", requestUnban);
  showPeopleButton.addEventListener("click", showPeople);
  sendButton.addEventListener("click", sendChat);
  leaveButton.addEventListener("click", leaveRequest);
  closeButton.addEventListener("click", closeMenu);

})

//close menu of ppl
function closeMenu(){
  closeButton.style.display = "none";
  peopleList.style.display = "none";
  sendButton.style.display = "block";
  chatInput.style.display = "block";
}

//logging in
function signOn(){
  if(loginInput.value == ""){
    errorMessage.innerText = "Error: Please enter a username."
  }
  else{
    socket = io.connect();
    //request to log in with inputted username
    socket.on("request_username", function(){
      errorMessage.innerText = "";
      username = loginInput.value;
      socket.emit("login", {username:username});
    })
    //response to login request
    socket.on("login_response", function(data){
      errorMessage.innerText = "";
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

  //for each received room, create and add room to room list div
  socket.on("room_list_response", function(data){
    errorMessage.innerText = "";
    data.roomList.forEach(function(room, i){
      let roomp = document.createElement("p");
      roomp.className = "room-list";
      roomp.innerText = room.roomName;
      if(room.isLocked){
        let span = document.createElement("span");
        span.innerText = " (locked)";
        span.className = "locked";
        roomp.appendChild(span);
      }
      roomp.addEventListener("click", function(){
        joinRoom(room.roomName);
      });

      roomList.appendChild(roomp);
    })
  });

  //loading the list of people in a room, and adding event listeners depending on why the list is being shown
  socket.on("people_response", function(data){
    errorMessage.innerText = "";
    peopleList.innerHTML = "";
    //if its for chatting purposes, add the "everyone" option
    if(requestType == "chat"){
      let every = document.createElement("p");
      every.className = "people-list";
      every.innerText = "Everyone";
      every.addEventListener("click", function(){
        chatPerson("Everyone");
      });
      peopleList.appendChild(every);
    }
    //creating a menu to select users
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
        //adding the appropriate event listener types depending on the purpose of the list being shown
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
        if(requestType == "unban"){
          personP.addEventListener("click", function(){
            unbanPerson(person.username);
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
    errorMessage.innerText = "";
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
    errorMessage.innerText = "";
    if(data.status == "success"){
      adminCommands.style.display = "none";
      homeScreen.style.display = "none";
      chatScreen.style.display = "block";
      passwordScreen.style.display = "none";
      browseScreen.style.display = "none";
      errorMessage.innerText = "";
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
    errorMessage.innerText = "";
    if(data.status == "success"){
      adminCommands.style.display = "block";
      createScreen.style.display="none";
      chatScreen.style.display="block";
      errorMessage.innerText = "";
    }
    else{
      errorMessage.innerText = data.message;
    }
  })

  //when non-admin attempts admin controls
  socket.on("access_denied", function(){
    errorMessage.innerText = "";
    alert("You do not have access to this action.");
  })

  //if admin control request failed
  socket.on("admin_control_response", function(data){
    errorMessage.innerText = "";
    if(data.status == "failure"){
      alert(data.message);
    }
  })

  //if user is muted
  socket.on("muted", function(){
    errorMessage.innerText = "";
    chattingBox.style.display = "none";
    mutedP.style.display = "block";
  })

  //if user is unmuted
  socket.on("unmuted", function(){
    errorMessage.innerText = "";
    chattingBox.style.display = "block";
    mutedP.style.display = "none";
  })

  //if user is removed from room
  socket.on("removed", function(){
    errorMessage.innerText = "";
    alert("You have been removed from the room.");
    window.location.reload(true);
  })

  //if user is banned from room
  socket.on("banned", function(){
    errorMessage.innerText = "";
    alert("You have been banned from the room.");
    window.location.reload(true);
  })

  //when user leaves room
  socket.on("successful_leave", function(){
    errorMessage.innerText = "";
    chatScreen.style.display = "none";
    homeScreen.style.display = "block";
  })
}

//requesting to join a room
function joinRoom(roomName = ""){
  if(roomInput.value == "" && roomName == ""){
    errorMessage.innerText = "Error: Please enter a room name."
  }
  else{
    if(roomName == "")
      roomName = roomInput.value;
    errorMessage.innerText = "";
    socket.emit("join_room", {roomName: roomName});
  }
}

//joining a private room
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
}

//when admin clicks on mute button
function requestMute(){
  socket.emit("people_list");
  requestType = "mute";
  if(!pplListShown){
    peopleList.style.display="block";
    closeButton.style.display = "block";
    pplListShown = !pplListShown;
    chatInput.style.display = "none";
    sendButton.style.display = "none";
  }
}

//when admin clicks on remove button
function requestRemove(){
  socket.emit("people_list");
  requestType = "remove";
  if(!pplListShown){
    peopleList.style.display="block";
    closeButton.style.display = "block";
    pplListShown = !pplListShown;
    chatInput.style.display = "none";
    sendButton.style.display = "none";
  }
}

//when admin clicks on ban button
function requestBan(){
  socket.emit("people_list");
  requestType = "ban";
  if(!pplListShown){
    peopleList.style.display="block";
    closeButton.style.display = "block";
    pplListShown = !pplListShown;
    chatInput.style.display = "none";
    sendButton.style.display = "none";
  }
}

//when admin clicks on unban button
function requestUnban(){
  socket.emit("ban_list");
  requestType = "unban";
  if(!pplListShown){
    peopleList.style.display="block";
    closeButton.style.display = "block";
    pplListShown = !pplListShown;
    chatInput.style.display = "none";
    sendButton.style.display = "none";
  }
}

//the show ppl button is clicked
function showPeople(){
  if(!pplListShown){
    socket.emit("people_list");
    requestType = "chat";
    peopleList.style.display = "block";
    closeButton.style.display = "block";
    pplListShown = !pplListShown;
    chatInput.style.display = "none";
    sendButton.style.display = "none";
  }
  else{
    peopleList.style.display = "none";
    pplListShown = !pplListShown;
    chatInput.style.display = "block";
    sendButton.style.display = "block";
  }
}

//when admin clicks on user to mute
function mutePerson(recipient){
  if(pplListShown){
    peopleList.style.display="none";
    pplListShown = !pplListShown;
    chatInput.style.display = "block";
    sendButton.style.display = "block";
  }
  socket.emit("mute_request", {target_user:recipient})
}

//when admin clicks on user to unmute
function unmutePerson(recipient){
  if(pplListShown){
    peopleList.style.display="none";
    pplListShown = !pplListShown;
    chatInput.style.display = "block";
    sendButton.style.display = "block";
  }
  socket.emit("unmute_request", {target_user:recipient})
}

//when admin clicks on user to remove
function removePerson(recipient){
  if(pplListShown){
    peopleList.style.display="none";
    pplListShown = !pplListShown;
    chatInput.style.display = "block";
    sendButton.style.display = "block";
  }
  socket.emit("remove_request", {target_user:recipient})
}

//when admin clicks on user to ban
function banPerson(recipient){
  if(pplListShown){
    peopleList.style.display="none";
    pplListShown = !pplListShown;
    chatInput.style.display = "block";
    sendButton.style.display = "block";
  }
  socket.emit("ban_request", {target_user:recipient})
}

//when admin clicks on user to unban
function unbanPerson(recipient){
  if(pplListShown){
    peopleList.style.display="none";
    pplListShown = !pplListShown;
    chatInput.style.display = "block";
    sendButton.style.display = "block";
  }
  socket.emit("unban_request", {target_user:recipient})
}

//when admin clicks on user to chat
function chatPerson(recipient){
  if(pplListShown){
    peopleList.style.display="none";
    pplListShown = !pplListShown;
    chatInput.style.display = "block";
    sendButton.style.display = "block";
  }
  recipientSpan.innerText = recipient;
}

//when send button is pressed
function sendChat(){
  if(chatInput.value == ""){
    errorMessage.innerText = "Error: Please enter a message"
  }
  else{
    errorMessage.innerText = "";
    chatText = chatInput.value;
    socket.emit("send_chat", {chat_content:chatText, recipient:recipientSpan.innerText, sender:username})
  }
}

//when leave room button is pressed
function leaveRequest(){
  socket.emit("user_left")
}
