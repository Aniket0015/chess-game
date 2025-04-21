const { Chess } = require("chess.js");
const roomuser = [];
const gamestate = new Map();

function handleMultiplayerJoin(io, socket) {
  if (!roomuser.includes(socket)) {
    roomuser.push(socket);
    console.log(`User ${socket.id} joined waiting room. Total waiting: ${roomuser.length}`);
  }

  if (roomuser.length >= 2) {
    const user1 = roomuser.shift();
    const user2 = roomuser.shift();

    if (user1.connected && user2.connected) {
      const roomid = `${user1.id}-${user2.id}*${Date.now()}`;
      user1.join(roomid);
      user2.join(roomid);
      user1.roomid = roomid;
      user2.roomid = roomid;

      const game = new Chess();

      gamestate.set(roomid, {
        game,
        players: {
          w: user1.id,
          b: user2.id,
        },
      });

      user1.emit("startGame", { roomid, color: "w" });
      user2.emit("startGame", { roomid, color: "b" });

      console.log(`Room ${roomid} created with ${user1.id} and ${user2.id}`);
    } else {
      if (user1.connected) roomuser.push(user1);
      if (user2.connected) roomuser.push(user2);
      console.log("Match failed - a user disconnected before room creation");
    }
  }
}

function handleMove(io, socket, data) {
  const { roomId, movedata } = data;
  const gameData = gamestate.get(roomId);

  if (!gameData) {
    socket.emit("error", { message: "Game not found" });
    return;
  }

  const game = gameData.game;
  const playerColor = socket.id === gameData.players.w ? "w" : "b";

  if (!movedata?.from || !movedata?.to) {
    socket.emit("invalidMove", {
      message: "Move must include 'from' and 'to'",
      fen: game.fen(),
    });
    return;
  }

  if (game.turn() !== playerColor) {
    socket.emit("invalidMove", {
      message: "It's not your turn!",
      fen: game.fen(),
      turn: game.turn(),
    });
    return;
  }

  let move;
  try {
    move = game.move(movedata);

    if (move == null) {
      socket.emit("invalidMove", {
        message: "Illegal move",
        fen: game.fen(),
        legalMoves: game.moves({ verbose: true }),
      });
      return;
    }

    console.log(`Move received from ${socket.id} in room ${roomId}`, move);
  } catch (err) {
    console.log("error =", err.message);
    socket.emit("invalidMove", {
      message: "Invalid move format or not your turn",
      error: err.message,
      fen: game.fen(),
      legalMoves: game.moves({ verbose: true }),
    });
    return;
  }

  const roomExists = io.sockets.adapter.rooms.has(roomId);
  if (!roomExists) {
    console.log(`Room ${roomId} does not exist!`);
    socket.emit("error", { message: "Game room not found" });
    return;
  }

  try {
    socket.to(roomId).emit("omove", {
      move,
      fen: game.fen(),
      turn: game.turn(),
    });

    socket.emit("moveConfirmed", {
      move,
      fen: game.fen(),
      turn: game.turn(),
    });

    console.log(`Move successfully emitted to room ${roomId}`);

    if (game.game_over()) {
      let result = "Draw";
      if (game.in_checkmate()) {
        result = `${playerColor === "w" ? "White" : "Black"} wins by checkmate`;
      } else if (game.in_stalemate()) {
        result = "Draw by stalemate";
      } else if (game.in_threefold_repetition()) {
        result = "Draw by repetition";
      } else if (game.insufficient_material()) {
        result = "Draw by insufficient material";
      } else if (game.in_draw()) {
        result = "Draw";
      }

      io.to(roomId).emit("gameOver", {
        result,
        fen: game.fen(),
        winner: result.includes("wins") ? playerColor : null,
      });

      gamestate.delete(roomId);
      console.log(`Game over in room ${roomId}: ${result}`);
    }
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
    console.log(`Removed disconnected user from waiting room. Total waiting: ${roomuser.length}`);
  }

  if (socket.roomid) {
    socket.to(socket.roomid).emit("opponentDisconnected", {
      message: "Your opponent has disconnected",
    });
    console.log(`Notified room ${socket.roomid} about disconnection`);
    gamestate.delete(socket.roomid);
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
