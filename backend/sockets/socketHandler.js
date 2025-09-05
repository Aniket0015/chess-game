// ============================
// Socket Handler for Chess Game
// ============================
//
// This file contains all multiplayer socket logic:
// - Matchmaking (queue & pairing)
// - Room creation & assignment
// - Game state tracking
// - Move validation & broadcasting
// - Game-over detection
// - Disconnect handling
//
// Dependencies:
// - chess.js: Provides the chess engine (rules, move validation, FEN states).
//

const { Chess } = require("chess.js");
const gamedb = require("../models/Game")
const Player = require('../models/Player');

// Queue of users waiting for a match.
// Each entry is a socket object of a connected player.
const roomuser = [];

// Active game states, keyed by roomId.
// Each value is an object containing:
//   game:    an instance of Chess() from chess.js
//   players: mapping of color → userId (or socket.id for now)
//       {
//          w: "user1Id",   // White player
//          b: "user2Id",   // Black player
//       }
const gamestate = new Map();


// =======================================
// Function: handleMultiplayerJoin
// Purpose:  Puts a player in the waiting queue.
//           When two players are available → creates a game room.
// =======================================
function handleMultiplayerJoin(io, socket) {
    console.log(`handleMultiplayerJoin called for ${socket.id}`);

    // Prevent duplicate join attempts
    if (socket.hasJoined) {
        console.log(`Socket ${socket.id} already in queue or game; skipping join.`);
        return;
    }
    socket.hasJoined = true;

    // Prevent joining if already in a game
    if (socket.roomid) {
        console.log(
            `Socket ${socket.id} already has room ${socket.roomid}; skipping queue.`
        );
        return;
    }

    // Add player to matchmaking queue
    roomuser.push(socket);
    console.log(
        `User ${socket.id} joined waiting room. Total waiting: ${roomuser.length}`
    );

    // When two players are waiting, pair them
    if (roomuser.length >= 2) {
        const user1 = roomuser.shift();
        const user2 = roomuser.shift();

        // Double-check both are still connected
        if (user1.connected && user2.connected) {
            // Generate a unique room ID
            const roomid = `${user1.id}-${user2.id}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

            // Put both users in the same room
            user1.join(roomid);
            user2.join(roomid);
            user1.roomid = roomid;
            user2.roomid = roomid;

            // Mark them as in-game so they can’t re-join the queue
            user1.hasJoined = true;
            user2.hasJoined = true;

            // Create new chess game
            const game = new Chess();
            gamestate.set(roomid, {
                game,
                players: {
                    w: user1.id,
                    b: user2.id,
                },
            });

            // Notify both players
            user1.emit("startGame", { roomid, color: "w" });
            user2.emit("startGame", { roomid, color: "b" });

            console.log(
                `Room ${roomid} created with ${user1.id} (w) and ${user2.id} (b)`
            );
        } else {
            // If one disconnected, return the other back to queue
            [user1, user2].forEach((u) => {
                if (u && u.connected) {
                    u.hasJoined = false;
                    roomuser.push(u);
                }
            });
            console.log("Match failed—one user disconnected before room creation");
        }
    }
}


// =======================================
// Function: handleMove
// Purpose:  Validates and applies a move.
//           Broadcasts it to opponent if legal.
//           Handles turn switching & game-over detection.
// =======================================
function handleMove(io, socket, data) {
    console.log(`handleMove called for ${socket.id}`, data);

    const { roomId, movedata } = data;
    const gameData = gamestate.get(roomId);

    if (!gameData) {
        return socket.emit("error", { message: "Game not found" });
    }

    const game = gameData.game;
    const playerColor = socket.id === gameData.players.w ? "w" : "b";

    // Check move structure
    if (!movedata?.from || !movedata?.to) {
        return socket.emit("invalidMove", {
            message: "Move must include 'from' and 'to'",
            fen: game.fen(),
        });
    }

    // Enforce turn order
    if (game.turn() !== playerColor) {
        return socket.emit("invalidMove", {
            message: "It's not your turn!",
            fen: game.fen(),
            turn: game.turn(),
        });
    }

    // Try to apply move
    let move;
    try {
        move = game.move(movedata);
        if (!move) {
            return socket.emit("invalidMove", {
                message: "Illegal move",
                fen: game.fen(),
                legalMoves: game.moves({ verbose: true }),
            });
        }
        console.log(`Move applied for ${socket.id} in room ${roomId}:`, move);
    } catch (err) {
        console.error(`Error applying move for ${socket.id}:`, err);
        return socket.emit("invalidMove", {
            message: "Invalid move format or not your turn",
            error: err.message,
            fen: game.fen(),
            legalMoves: game.moves({ verbose: true }),
        });
    }

    // Verify room still exists
    if (!io.sockets.adapter.rooms.has(roomId)) {
        console.warn(`Room ${roomId} no longer exists`);
        return socket.emit("error", { message: "Game room not found" });
    }

    // Broadcast the move to opponent
    socket.to(roomId).emit("omove", {
        move,
        fen: game.fen(),
        turn: game.turn(),
    });

    // Confirm move back to player
    socket.emit("moveConfirmed", {
        move,
        fen: game.fen(),
        turn: game.turn(),
    });

    console.log(`Move broadcast in room ${roomId}.`);

    // Check for game-over conditions
    if (game.isGameOver()) {
        let result = "Draw";
        if (game.isCheckmate()) {
            result = `${playerColor === "w" ? "White" : "Black"} wins by checkmate`;
        } else if (game.isStalemate()) {
            result = "Draw by stalemate";
        } else if (game.isThreefoldRepetition()) {
            result = "Draw by repetition";
        } else if (game.isInsufficientMaterial()) {
            result = "Draw by insufficient material";
        } else if (game.isDraw()) {
            result = "Draw";
        }

        // Announce game over
        io.to(roomId).emit("gameOver", {
            result,
            fen: game.fen(),
            winner: result.includes("wins") ? playerColor : null,
        });

        // Clean up game state
        gamestate.delete(roomId);
        console.log(`Game over in room ${roomId}: ${result}`);
    }
}


// =======================================
// Function: handleDisconnect
// Purpose:  Removes player from queue/game.
//           Notifies opponent if inside a room.
// =======================================
function handleDisconnect(io, socket, reason) {
    console.log(`User ${socket.id} disconnected: ${reason}`);

    // Remove from waiting room if present
    const idx = roomuser.indexOf(socket);
    if (idx !== -1) {
        roomuser.splice(idx, 1);
        console.log(
            `Removed ${socket.id} from waiting room. Now ${roomuser.length} waiting.`
        );
    }

    // Notify opponent & delete game state if player was in a game
    if (socket.roomid) {
        socket.to(socket.roomid).emit("opponentDisconnected", {
            message: "Your opponent has disconnected",
        });
        console.log(`Notified room ${socket.roomid} about disconnection`);
        gamestate.delete(socket.roomid);
    }
}


// =======================================
// Function: handleG
// Purpose:  Example/test event handler.
// =======================================
function handleG(socket, reason) {
    console.log(`G event from ${socket.id}:`, reason);
}


// =======================================
// Exports
// =======================================
module.exports = {
    handleMultiplayerJoin,
    handleMove,
    handleDisconnect,
    handleG,
};
