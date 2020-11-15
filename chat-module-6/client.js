let loginScreen;
let homeScreen;
let passwordScreen;
let createScreen;
let browseScreen;
let chatScreen;

let loginButton;    //login
let loginInput;     //username
let roomInput;      //room-name
let joinRoomButton;  //join-room
let browseRoomsButton;   //browse
let createRoomButton;    //create-room
let passwordInput;      //password-input
let createNameInput;
let createPasswordInput;
let createButton;

document.addEventListener("DOMContentLoaded", function(){
  loginScreen = document.getElementById("login-screen");
  homeScreen = document.getElementById("home-screen");
  passwordScreen = document.getElementById("password-screen");
  createScreen = document.getElementById("create-screen");

  loginButton = document.getElementById("login");
  loginInput = document.getElementById("username");
  roomInput = document.getElementById("room-name");
  joinRoomButton = document.getElementById("join-room");
  browseRoomsButton = document.getElementById("browse");
  createRoomButton = document.getElementById("create-room");
  passwordInput = document.getElementById("password-input");
  createNameInput = document.getElementById("new-room-name");
  createPasswordInput = document.getElementById("new-room-password");
  createButton = document.getElementById("create-room-button");
  browseScreen = document.getElementById("browse-screen");


})
