const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);
const path = require("path");
const public = path.join(__dirname, "public");
app.use(express.static(path.join(__dirname, "/build")));
app.get("*", function (req, res) {
  res.sendFile(__dirname + "/build/index.html");
});
function numClientsInRoom(room) {
  try {
    const clients = io.nsps["/"].adapter.rooms[room].sockets;
    return Object.keys(clients).length;
  } catch (error) {
    return 0;
  }
}
// // enable ssl redirect
// app.use(sslRedirect());

// When a socket connects, set up the specific listeners we will use.
io.on("connection", function (socket) {
  // When a client tries to join a room, only allow them if they are first or
  // second in the room. Otherwise it is full.
  socket.on("join", function (room) {
    const clients = io.sockets.adapter.rooms[room];
    const numClients = typeof clients !== "undefined" ? clients.length : 0;
    if (numClients === 0) {
      socket.join(room);
    } else if (numClients === 1) {
      socket.join(room);
      // First to join call initiates call
      socket.emit("ready", room).to(room);
      socket.broadcast.to(room).emit("ready", room);
    } else {
      socket.emit("full", room);
    }
  });

  // Relay candidate messages
  socket.on("candidate", function (candidate, room) {
    socket.broadcast.to(room).emit("candidate", candidate);
  });

  // Relay offers
  socket.on("offer", function (offer, room) {
    socket.broadcast.to(room).emit("offer", offer);
  });

  // Relay answers
  socket.on("answer", function (answer, room) {
    socket.broadcast.to(room).emit("answer", answer);
  });
});

// Listen for Heroku port, otherwise just use 3000
const port = process.env.PORT || 80;
http.listen(port, function () {
  console.log("http://localhost:" + port);
});
