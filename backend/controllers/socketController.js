const {
    handleMultiplayerJoin,
    handleMove,
    handleDisconnect,
    handleG,
  } = require("../controllers/socketController");
  
  function sockethandler(io) {
    io.on("connection", (socket) => {
      console.log("User connected:", socket.id);
  
      socket.on("multiplayerjoin", () => handleMultiplayerJoin(io, socket));
      socket.on("move", (data) => handleMove(io, socket, data));
      socket.on("disconnect", (reason) => handleDisconnect(io, socket, reason));
      socket.on("g", (reason) => handleG(socket, reason));
    });
  }
  
  module.exports = sockethandler;
  