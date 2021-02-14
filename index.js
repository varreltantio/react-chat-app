const express = require("express");
const favicon = require("express-favicon");
const socketio = require("socket.io");
const http = require("http");
const path = require("path");
const cors = require("cors");

const PORT = process.env.PORT || 5000;

const {addUser, removeUser, getUser, getUsersInRoom} = require("./users");

const app = express();
const server= http.createServer(app);
const io = socketio(server);


app.use(favicon(__dirname + "/build/favicon.ico"));
app.use(express.static(__dirname));
app.use(express.static(path.join(__dirname, "build")));

app.get("/*", function (req, res) {
  res.sendFile(path.join(__dirname, "build", "index.html"));
});

app.use(cors());

io.on("connection", (socket) => {
  socket.on("join", ({ name, room }, callback) => {
    const {error, user} = addUser({id: socket.id, name, room});

    if (error) return callback(error);

    // message to user and everyone in room chat
    socket.emit("message", {user: "admin", text: `${user.name} welcome to the room ${user.room}`});
    socket.broadcast.to(user.room).emit("message", {user: "admin", text: `${user.name} has joined`});

    // user join to room chat
    socket.join(user.room);

    io.to(user.room).emit("roomData", { room: user.room, users: getUsersInRoom(user.room)});

    callback();
  });

  socket.on("sendMessage", (message, callback) => {
    const user = getUser(socket.id);

    io.to(user.room).emit("message", {user: user.name, text: message});

    callback();
  })

  socket.on("disconnect", () => {
    const user = removeUser(socket.id);

    if (user) {
      io.to(user.room).emit("message", {user: "admin", text: `${user.name} has left`});
      io.to(user.room).emit("roomData", {room: user.room, users: getUsersInRoom(user.room)});
    }
  });
});

server.listen(PORT, () => console.log(`Server has started on port = ${PORT}`));