// /sockets/socketHandler.js
const roomuser = [];

function handleMultiplayerJoin(io, socket) {
  if (!roomuser.includes(socket)) {
    roomuser.push(socket);
    console.log(
      `User ${socket.id} joined waiting room. Total waiting: ${roomuser.length}`
    );
  }

  if (roomuser.length >= 2) {
    const user1 = roomuser.shift();
    const user2 = roomuser.shift();

    if (user1.connected && user2.connected) {
      const roomid = `${user1.id}-${user2.id}*${Date.now() / 12}`;
      user1.join(roomid);
      user2.join(roomid);
      user1.roomid = roomid;
      user2.roomid = roomid;

      user1.emit("startGame", { roomid, player: 1 });
      user2.emit("startGame", { roomid, player: 2 });
      console.log(`Room ${roomid} created with ${user1.id} and ${user2.id}`);
    } else {
      if (user1.connected) roomuser.push(user1);
      if (user2.connected) roomuser.push(user2);
      console.log("Match failed - a user disconnected before room creation");
    }
  }
}

function handleMove(io, socket, data) {
  if (!data || !data.roomId) {
    console.log("Error: Invalid move data received", data?.movedata);
    return;
  }

  const roomId = data.roomId;
  console.log(`Move received from ${socket.id} in room ${roomId}`, data.movedata);

  const roomExists = io.sockets.adapter.rooms.has(roomId);
  if (!roomExists) {
    console.log(`Room ${roomId} does not exist!`);
    socket.emit("error", { message: "Game room not found" });
    return;
  }

  try {
    socket.to(roomId).emit("omove", data.movedata);
    console.log(`Move successfully emitted to room ${roomId}`);
  } catch (err) {
    console.error("Error emitting move:", err);
    socket.emit("error", { message: "Error processing your move" });
  }
}

function handleDisconnect(io, socket, reason) {
  console.log(`User ${socket.id} disconnected: ${reason}`);

  const index = roomuser.indexOf(socket);
  if (index > -1) {
    roomuser.splice(index, 1);
    console.log(
      `Removed disconnected user from waiting room. Total waiting: ${roomuser.length}`
    );
  }

  if (socket.roomid) {
    socket.to(socket.roomid).emit("opponentDisconnected", {
      message: "Your opponent has disconnected",
    });
    console.log(`Notified room ${socket.roomid} about disconnection`);
  }
}

function handleG(socket, reason) {
  console.log(`G event from ${socket.id}:`, reason);
}

module.exports = {
  handleMultiplayerJoin,
  handleMove,
  handleDisconnect,
  handleG,
};
