const mongoose = require("mongoose");

const gameSchema = new mongoose.Schema({
  roomId: { type: String, required: true },
  players: [{ type: String }], 
  moves: [
    {
      player: Number,
      moveData: mongoose.Schema.Types.Mixed,
      time: { type: Date, default: Date.now },
    },
  ],
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Game", gameSchema);
